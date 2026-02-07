from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import func
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, PageView

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/track', methods=['POST'])
def track_page_view():
    """记录页面访问（无需认证，前端调用）"""
    data = request.get_json() or {}
    
    page_view = PageView(
        page_path=data.get('path', '/'),
        visitor_id=data.get('visitor_id'),
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:500],
        referrer=data.get('referrer', '')[:500] if data.get('referrer') else None
    )
    
    db.session.add(page_view)
    db.session.commit()
    
    return jsonify({'success': True})


@analytics_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_analytics_stats():
    """获取统计数据（需要管理员认证）"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    
    # 今日PV
    today_pv = PageView.query.filter(PageView.created_at >= today_start).count()
    
    # 今日UV（按visitor_id去重）
    today_uv = db.session.query(func.count(func.distinct(PageView.visitor_id))).filter(
        PageView.created_at >= today_start,
        PageView.visitor_id.isnot(None)
    ).scalar() or 0
    
    # 本周PV
    week_pv = PageView.query.filter(PageView.created_at >= week_start).count()
    
    # 本月PV
    month_pv = PageView.query.filter(PageView.created_at >= month_start).count()
    
    # 总PV
    total_pv = PageView.query.count()
    
    # 热门页面（Top 5）
    top_pages = db.session.query(
        PageView.page_path,
        func.count(PageView.id).label('count')
    ).group_by(PageView.page_path).order_by(func.count(PageView.id).desc()).limit(5).all()
    
    # 最近7天每日PV趋势
    daily_stats = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = PageView.query.filter(
            PageView.created_at >= day_start,
            PageView.created_at < day_end
        ).count()
        daily_stats.append({
            'date': day_start.strftime('%m-%d'),
            'pv': count
        })
    
    return jsonify({
        'todayPV': today_pv,
        'todayUV': today_uv,
        'weekPV': week_pv,
        'monthPV': month_pv,
        'totalPV': total_pv,
        'topPages': [{'path': p[0], 'count': p[1]} for p in top_pages],
        'dailyStats': daily_stats
    })
