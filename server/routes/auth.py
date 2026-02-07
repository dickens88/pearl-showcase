from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, Admin

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """管理员登录"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': '请输入用户名和密码'}), 400
    
    admin = Admin.query.filter_by(username=username).first()
    
    if not admin or not check_password_hash(admin.password_hash, password):
        return jsonify({'message': '用户名或密码错误'}), 401
    
    # identity 必须是字符串
    access_token = create_access_token(identity=str(admin.id))
    
    return jsonify({
        'token': access_token,
        'user': admin.to_dict()
    })

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """修改管理员密码"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')

    if not old_password or not new_password:
        return jsonify({'message': '请输入旧密码和新密码'}), 400

    admin = Admin.query.get(int(current_user_id))
    
    if not admin:
         return jsonify({'message': '用户不存在'}), 404

    if not check_password_hash(admin.password_hash, old_password):
        return jsonify({'message': '旧密码错误'}), 400

    admin.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'message': '密码修改成功'})
