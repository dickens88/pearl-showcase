from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Admin(db.Model):
    """管理员模型"""
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username
        }


class Jewelry(db.Model):
    """饰品模型"""
    __tablename__ = 'jewelry'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    name_en = db.Column(db.String(100))
    category = db.Column(db.String(50), default='耳饰')
    description = db.Column(db.Text)
    description_en = db.Column(db.Text)
    order_index = db.Column(db.Integer, default=0)
    is_visible = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联图片
    images = db.relationship('Image', backref='jewelry', lazy=True, order_by='Image.order_index')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_en': self.name_en,
            'category': self.category,
            'description': self.description,
            'description_en': self.description_en,
            'order_index': self.order_index,
            'is_visible': self.is_visible,
            'is_featured': self.is_featured,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'images': [img.to_dict() for img in self.images]
        }


class Image(db.Model):
    """图片模型"""
    __tablename__ = 'images'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255))
    path = db.Column(db.String(500), nullable=False)
    jewelry_id = db.Column(db.Integer, db.ForeignKey('jewelry.id'), nullable=True)
    description = db.Column(db.Text)  # 为该图片添加特定说明
    description_en = db.Column(db.Text) # 英文特定说明
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'path': self.path,
            'thumbnail_path': f"{self.path.rsplit('.', 1)[0]}_thumb.{self.path.rsplit('.', 1)[1]}",
            'jewelry_id': self.jewelry_id,
            'description': self.description,
            'description_en': self.description_en,
            'order_index': self.order_index
        }


class PageView(db.Model):
    """页面访问记录模型"""
    __tablename__ = 'page_views'
    
    id = db.Column(db.Integer, primary_key=True)
    page_path = db.Column(db.String(255), nullable=False)
    visitor_id = db.Column(db.String(100))  # 用于计算UV的访客标识
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    referrer = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'page_path': self.page_path,
            'visitor_id': self.visitor_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Page(db.Model):
    """页面内容模型"""
    __tablename__ = 'pages'
    
    id = db.Column(db.Integer, primary_key=True)
    page_key = db.Column(db.String(50), unique=True, nullable=False)
    content = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'page_key': self.page_key,
            'content': self.content,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class GalleryImage(db.Model):
    """首页展廊图片模型"""
    __tablename__ = 'gallery_images'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255))
    path = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(100))  # 图片标题
    title_en = db.Column(db.String(100))  # 英文标题
    alt = db.Column(db.String(200))  # alt描述
    order_index = db.Column(db.Integer, default=0)
    is_visible = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'path': self.path,
            'title': self.title,
            'title_en': self.title_en,
            'alt': self.alt,
            'order_index': self.order_index,
            'is_visible': self.is_visible,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
