from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
import os
import uuid
import sys

# Pillow is optional - if not available, images won't be compressed
try:
    from PIL import Image as PILImage
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, GalleryImage

gallery_bp = Blueprint('gallery', __name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def compress_image(filepath, max_size=(1200, 1200), thumb_size=(400, 400), quality=85):
    """压缩图片并生成缩略图（如果Pillow可用）"""
    if not PILLOW_AVAILABLE:
        return None  # 跳过压缩
    
    try:
        # 获取基础文件名和路径
        base_dir = os.path.dirname(filepath)
        filename = os.path.basename(filepath)
        name, ext = os.path.splitext(filename)
        
        # 定义WebP文件名
        webp_name = f"{name}.webp"
        webp_path = os.path.join(base_dir, webp_name)
        
        # 定义缩略图文件名
        thumb_name = f"thumb_{name}.webp"
        thumb_path = os.path.join(base_dir, thumb_name)
        
        with PILImage.open(filepath) as img:
            # 处理方向信息
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except:
                pass
                
            # 转换为RGB
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 1. 保存主图 WebP
            main_img = img.copy()
            main_img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
            main_img.save(webp_path, 'WEBP', quality=quality, optimize=True)
            
            # 2. 保存缩略图 WebP
            thumb_img = img.copy()
            thumb_img.thumbnail(thumb_size, PILImage.Resampling.LANCZOS)
            thumb_img.save(thumb_path, 'WEBP', quality=quality, optimize=True)
            
        # 如果原始文件不是WebP，且转换成功，可以删除原始文件
        if filepath != webp_path and os.path.exists(webp_path):
            os.remove(filepath)
            
        return webp_name, thumb_name
    except Exception as e:
        print(f'压缩图片失败: {e}')
        return None, None

@gallery_bp.route('', methods=['GET'])
def get_gallery_images():
    """获取展廊图片（公开接口）"""
    visible_only = request.args.get('visible', 'true').lower() == 'true'
    
    query = GalleryImage.query.order_by(GalleryImage.order_index)
    if visible_only:
        query = query.filter_by(is_visible=True)
    
    images = query.all()
    return jsonify([img.to_dict() for img in images])


@gallery_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_gallery_images():
    """获取所有展廊图片（管理接口）"""
    images = GalleryImage.query.order_by(GalleryImage.order_index).all()
    return jsonify([img.to_dict() for img in images])


@gallery_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_gallery_image():
    """上传展廊图片"""
    if 'image' not in request.files:
        return jsonify({'message': '没有上传文件'}), 400
    
    file = request.files['image']
    
    if not file or not allowed_file(file.filename):
        return jsonify({'message': '不支持的文件格式'}), 400
    
    # 生成唯一文件名
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext in ('jpg', 'jpeg'):
        ext = 'jpg'
    filename = f"gallery_{uuid.uuid4().hex}.{ext}"
    
    # 保存文件
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # 压缩图片并生成缩略图
    new_filename, thumb_filename = compress_image(filepath)
    
    # 如果转换成功，更新信息
    final_filename = new_filename if new_filename else filename
    
    # 获取当前最大排序值
    max_order = db.session.query(db.func.max(GalleryImage.order_index)).scalar() or 0
    
    # 保存到数据库
    gallery_image = GalleryImage(
        filename=final_filename,
        original_name=secure_filename(file.filename),
        path=f'/uploads/{final_filename}',
        thumb_path=f'/uploads/{thumb_filename}' if thumb_filename else f'/uploads/{final_filename}',
        title=request.form.get('title', ''),
        title_en=request.form.get('title_en', ''),
        alt=request.form.get('alt', ''),
        order_index=max_order + 1,
        is_visible=True
    )
    db.session.add(gallery_image)
    db.session.commit()
    
    return jsonify({
        'message': '上传成功',
        'image': gallery_image.to_dict()
    }), 201


@gallery_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_gallery_image(id):
    """更新展廊图片信息"""
    image = GalleryImage.query.get_or_404(id)
    data = request.get_json()
    
    if 'title' in data:
        image.title = data['title']
    if 'title_en' in data:
        image.title_en = data['title_en']
    if 'alt' in data:
        image.alt = data['alt']
    if 'order_index' in data:
        image.order_index = data['order_index']
    if 'is_visible' in data:
        image.is_visible = data['is_visible']
    
    db.session.commit()
    
    return jsonify(image.to_dict())


@gallery_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_gallery_image(id):
    """删除展廊图片"""
    image = GalleryImage.query.get_or_404(id)
    
    # 删除文件
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], image.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # 删除数据库记录
    db.session.delete(image)
    db.session.commit()
    
    return jsonify({'message': '删除成功'})


@gallery_bp.route('/reorder', methods=['POST'])
@jwt_required()
def reorder_gallery_images():
    """重新排序展廊图片"""
    data = request.get_json()
    order_list = data.get('order', [])  # [{ id: 1, order_index: 0 }, ...]
    
    for item in order_list:
        image = GalleryImage.query.get(item['id'])
        if image:
            image.order_index = item['order_index']
    
    db.session.commit()
    
    return jsonify({'message': '排序更新成功'})
