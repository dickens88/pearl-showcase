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
    print("警告: Pillow未安装，图片将不会被压缩")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, Image

images_bp = Blueprint('images', __name__)

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

@images_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_images():
    """上传图片"""
    print(f"收到上传请求")
    print(f"Headers: {dict(request.headers)}")
    print(f"Files: {request.files}")
    
    if 'images' not in request.files:
        return jsonify({'message': '没有上传文件'}), 400
    
    files = request.files.getlist('images')
    jewelry_id = request.form.get('jewelry_id')
    
    uploaded = []
    
    for file in files:
        if file and allowed_file(file.filename):
            # 生成唯一文件名
            ext = file.filename.rsplit('.', 1)[1].lower()
            if ext in ('jpg', 'jpeg'):
                ext = 'jpg'
            filename = f"{uuid.uuid4().hex}.{ext}"
            
            # 保存文件
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # 压缩图片并生成缩略图
            new_filename, thumb_filename = compress_image(filepath)
            
            # 如果转换成功，更新信息
            final_filename = new_filename if new_filename else filename
            
            # 保存到数据库
            image = Image(
                filename=final_filename,
                original_name=secure_filename(file.filename),
                path=f'/uploads/{final_filename}',
                thumb_path=f'/uploads/{thumb_filename}' if thumb_filename else f'/uploads/{final_filename}',
                jewelry_id=int(jewelry_id) if jewelry_id else None
            )
            db.session.add(image)
            uploaded.append(image)
    
    db.session.commit()
    
    return jsonify({
        'message': f'成功上传 {len(uploaded)} 张图片',
        'images': [img.to_dict() for img in uploaded]
    }), 201


@images_bp.route('/images', methods=['GET'])
@jwt_required()
def get_images():
    """获取所有图片"""
    images = Image.query.order_by(Image.created_at.desc()).all()
    return jsonify([img.to_dict() for img in images])


@images_bp.route('/images/<int:id>', methods=['PUT'])
@jwt_required()
def update_image(id):
    """更新图片信息"""
    image = Image.query.get_or_404(id)
    data = request.get_json()
    
    if 'jewelry_id' in data:
        image.jewelry_id = data['jewelry_id'] if data['jewelry_id'] else None
    if 'order_index' in data:
        image.order_index = data['order_index']
    if 'description' in data:
        image.description = data['description']
    if 'description_en' in data:
        image.description_en = data['description_en']
    
    db.session.commit()
    
    return jsonify(image.to_dict())


@images_bp.route('/images/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_image(id):
    """删除图片"""
    image = Image.query.get_or_404(id)
    
    # 删除文件
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], image.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # 删除数据库记录
    db.session.delete(image)
    db.session.commit()
    
    return jsonify({'message': '删除成功'})
