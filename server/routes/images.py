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


def compress_image(filepath, max_size=(1200, 1200), quality=85):
    """压缩图片（如果Pillow可用）"""
    if not PILLOW_AVAILABLE:
        return  # 跳过压缩
    
    try:
        with PILImage.open(filepath) as img:
            # 转换为RGB（处理RGBA等格式）
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # 调整大小
            img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
            
            # 保存
            img.save(filepath, 'JPEG', quality=quality, optimize=True)
    except Exception as e:
        print(f'压缩图片失败: {e}')


def create_thumbnail(filepath, max_size=(400, 400), quality=80):
    """生成缩略图（如果Pillow可用）"""
    if not PILLOW_AVAILABLE:
        return
    
    try:
        path_parts = filepath.rsplit('.', 1)
        thumb_path = f"{path_parts[0]}_thumb.{path_parts[1]}"
        
        with PILImage.open(filepath) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
            img.save(thumb_path, 'JPEG', quality=quality, optimize=True)
    except Exception as e:
        print(f'生成缩略图失败: {e}')


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
            
            # 压缩图片
            compress_image(filepath)
            
            # 生成缩略图
            create_thumbnail(filepath)
            
            # 保存到数据库
            image = Image(
                filename=filename,
                original_name=secure_filename(file.filename),
                path=f'/uploads/{filename}',
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
