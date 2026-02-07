from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, Jewelry, Image

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """获取统计数据"""
    jewelry_count = Jewelry.query.count()
    image_count = Image.query.count()
    visible_count = Jewelry.query.filter_by(is_visible=True).count()
    
    return jsonify({
        'jewelryCount': jewelry_count,
        'imageCount': image_count,
        'visibleCount': visible_count
    })
