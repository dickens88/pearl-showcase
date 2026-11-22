"""前台用户：注册、登录、个人信息、收藏夹

用户 Token 带有 role=user 声明，app.py 中的全局校验会阻止它访问
任何非本蓝图的受保护接口（即后台管理接口）。
"""
import re
import sys
import os
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash, generate_password_hash

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User, Favorite, Jewelry

user_bp = Blueprint('user', __name__)

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
MIN_PASSWORD_LEN = 8


def user_required(fn):
    """仅允许前台用户 Token 访问"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if get_jwt().get('role') != 'user':
            return jsonify({'message': 'forbidden'}), 403
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return jsonify({'message': 'user_not_found'}), 401
        return fn(user, *args, **kwargs)
    return wrapper


def _issue_token(user):
    return create_access_token(identity=str(user.id), additional_claims={'role': 'user'})


@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    nickname = (data.get('nickname') or '').strip()[:50] or None

    if not EMAIL_RE.match(email) or len(email) > 120:
        return jsonify({'code': 'invalid_email', 'message': 'Invalid email'}), 400
    if len(password) < MIN_PASSWORD_LEN:
        return jsonify({'code': 'weak_password', 'message': 'Password too short'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'code': 'email_taken', 'message': 'Email already registered'}), 409

    user = User(email=email, nickname=nickname, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({'token': _issue_token(user), 'user': user.to_dict()}), 201


@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'code': 'invalid_credentials', 'message': 'Invalid email or password'}), 401
    return jsonify({'token': _issue_token(user), 'user': user.to_dict()})


@user_bp.route('/me', methods=['GET'])
@user_required
def me(user):
    return jsonify(user.to_dict())


@user_bp.route('/favorites', methods=['GET'])
@user_required
def list_favorites(user):
    """返回收藏的饰品（仅前台可见的），按收藏时间倒序"""
    rows = (db.session.query(Jewelry)
            .join(Favorite, Favorite.jewelry_id == Jewelry.id)
            .filter(Favorite.user_id == user.id, Jewelry.is_visible.is_(True))
            .order_by(Favorite.created_at.desc())
            .all())
    return jsonify([j.to_dict() for j in rows])


@user_bp.route('/favorites/ids', methods=['GET'])
@user_required
def favorite_ids(user):
    ids = [f.jewelry_id for f in Favorite.query.filter_by(user_id=user.id).all()]
    return jsonify(ids)


@user_bp.route('/favorites/<int:jewelry_id>', methods=['POST'])
@user_required
def add_favorite(user, jewelry_id):
    jewelry = Jewelry.query.get(jewelry_id)
    if not jewelry or not jewelry.is_visible:
        return jsonify({'message': 'not_found'}), 404
    if not Favorite.query.filter_by(user_id=user.id, jewelry_id=jewelry_id).first():
        db.session.add(Favorite(user_id=user.id, jewelry_id=jewelry_id))
        db.session.commit()
    return jsonify({'favorited': True})


@user_bp.route('/favorites/<int:jewelry_id>', methods=['DELETE'])
@user_required
def remove_favorite(user, jewelry_id):
    Favorite.query.filter_by(user_id=user.id, jewelry_id=jewelry_id).delete()
    db.session.commit()
    return jsonify({'favorited': False})
