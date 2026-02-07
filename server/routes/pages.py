from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, Page

pages_bp = Blueprint('pages', __name__)

@pages_bp.route('', methods=['GET'])
@jwt_required()
def get_pages():
    """获取所有页面内容"""
    pages = Page.query.all()
    return jsonify([p.to_dict() for p in pages])


@pages_bp.route('/<page_key>', methods=['GET'])
def get_page(page_key):
    """获取单个页面内容"""
    page = Page.query.filter_by(page_key=page_key).first()
    
    if not page:
        return jsonify({}), 200
    
    try:
        content = json.loads(page.content) if page.content else {}
    except:
        content = {}
    
    return jsonify(content)


@pages_bp.route('/<page_key>', methods=['PUT'])
@jwt_required()
def update_page(page_key):
    """更新页面内容"""
    page = Page.query.filter_by(page_key=page_key).first()
    
    if not page:
        page = Page(page_key=page_key)
        db.session.add(page)
    
    data = request.get_json()
    page.content = data.get('content', '{}')
    
    db.session.commit()
    
    return jsonify(page.to_dict())
