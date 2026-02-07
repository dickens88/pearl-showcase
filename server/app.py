import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from models import db, Admin, Page

def create_app():
    app = Flask(__name__, static_folder='uploads')
    
    # 配置
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'pearl-elegance-secret-key-2024')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'pearl-jwt-secret-key-2024')
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    
    # 确保上传目录存在
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # 初始化扩展
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    
    # JWT 错误处理
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"无效的Token: {error}")
        return {'message': f'无效的Token: {error}'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"缺少Token: {error}")
        return {'message': f'缺少认证Token: {error}'}, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"Token已过期")
        return {'message': 'Token已过期，请重新登录'}, 401
    
    # 注册蓝图
    from routes.auth import auth_bp
    from routes.jewelry import jewelry_bp
    from routes.images import images_bp
    from routes.pages import pages_bp
    from routes.admin import admin_bp
    from routes.analytics import analytics_bp
    from routes.gallery import gallery_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(jewelry_bp, url_prefix='/api/jewelry')
    app.register_blueprint(images_bp, url_prefix='/api')
    app.register_blueprint(pages_bp, url_prefix='/api/pages')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(gallery_bp, url_prefix='/api/gallery')
    
    # 静态文件服务
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # 健康检查
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': '安澜・拾光 API 服务运行中'}
    
    # 占位图片
    @app.route('/api/placeholder/<name>')
    def placeholder(name):
        # 返回一个简单的SVG占位图
        svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
            <rect fill="#E8E4DF" width="400" height="500"/>
            <circle cx="200" cy="200" r="60" fill="#D4CEC6"/>
            <text x="200" y="350" text-anchor="middle" fill="#999" font-size="14">珍珠饰品</text>
        </svg>'''
        return svg, 200, {'Content-Type': 'image/svg+xml'}
    
    # 初始化数据库
    with app.app_context():
        db.create_all()
        
        # 创建默认管理员
        if not Admin.query.filter_by(username='admin').first():
            admin = Admin(
                username='admin',
                password_hash=generate_password_hash('pearl2024')
            )
            db.session.add(admin)
            db.session.commit()
            print('默认管理员已创建: admin / pearl2024')
        
        # 创建默认页面
        default_pages = ['home', 'about', 'contact']
        for page_key in default_pages:
            if not Page.query.filter_by(page_key=page_key).first():
                page = Page(page_key=page_key, content='{}')
                db.session.add(page)
        db.session.commit()
    
    return app


if __name__ == '__main__':
    app = create_app()
    print('=' * 50)
    print('安澜・拾光 API 服务器启动中...')
    print('地址: http://localhost:5000')
    print('默认管理员: admin / pearl2024')
    print('=' * 50)
    app.run(debug=True, port=5000)
