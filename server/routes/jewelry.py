from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, Jewelry

jewelry_bp = Blueprint('jewelry', __name__)

@jewelry_bp.route('', methods=['GET'])
def get_jewelry():
    """获取饰品列表"""
    featured = request.args.get('featured')
    limit = request.args.get('limit', type=int)
    all_items = request.args.get('all', 'false').lower() == 'true'
    
    
    page = request.args.get('page', type=int)
    
    query = Jewelry.query
    
    if not all_items:
        query = query.filter_by(is_visible=True)
    
    if featured:
        query = query.filter_by(is_featured=True)
    
    query = query.order_by(Jewelry.order_index.asc())
    
    if page:
        per_page = limit if limit else 10
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'items': [j.to_dict() for j in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'page': pagination.page,
            'per_page': pagination.per_page
        })
    
    if limit:
        query = query.limit(limit)
    
    jewelry = query.all()
    return jsonify([j.to_dict() for j in jewelry])


@jewelry_bp.route('/<int:id>', methods=['GET'])
def get_jewelry_item(id):
    """获取单个饰品"""
    jewelry = Jewelry.query.get_or_404(id)
    return jsonify(jewelry.to_dict())


@jewelry_bp.route('', methods=['POST'])
@jwt_required()
def create_jewelry():
    """创建饰品"""
    data = request.get_json()
    
    jewelry = Jewelry(
        name=data.get('name', ''),
        name_en=data.get('name_en', ''),
        category=data.get('category', '耳饰'),
        description=data.get('description', ''),
        description_en=data.get('description_en', ''),
        order_index=data.get('order_index', 0),
        is_visible=data.get('is_visible', True),
        is_featured=data.get('is_featured', False)
    )
    
    db.session.add(jewelry)
    db.session.commit()
    
    return jsonify(jewelry.to_dict()), 201


@jewelry_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_jewelry(id):
    """更新饰品"""
    jewelry = Jewelry.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        jewelry.name = data['name']
    if 'name_en' in data:
        jewelry.name_en = data['name_en']
    if 'category' in data:
        jewelry.category = data['category']
    if 'description' in data:
        jewelry.description = data['description']
    if 'description_en' in data:
        jewelry.description_en = data['description_en']
    if 'order_index' in data:
        jewelry.order_index = data['order_index']
    if 'is_visible' in data:
        jewelry.is_visible = data['is_visible']
    if 'is_featured' in data:
        jewelry.is_featured = data['is_featured']
    
    db.session.commit()
    
    return jsonify(jewelry.to_dict())


@jewelry_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_jewelry(id):
    """删除饰品"""
    jewelry = Jewelry.query.get_or_404(id)
    db.session.delete(jewelry)
    db.session.commit()
    
    return jsonify({'message': '删除成功'})
