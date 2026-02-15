import os
import sys
from PIL import Image as PILImage

# Add the server directory to the path so we can import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import create_app
from models import db, Image, GalleryImage

def migrate():
    app = create_app()
    with app.app_context():
        print("Starting image migration...")
        upload_folder = app.config['UPLOAD_FOLDER']
        
        # 1. Process regular images
        images = Image.query.all()
        for img in images:
            if not img.thumb_path:
                filepath = os.path.join(upload_folder, img.filename)
                if os.path.exists(filepath):
                    name, ext = os.path.splitext(img.filename)
                    thumb_name = f"thumb_{name}.webp"
                    thumb_path = os.path.join(upload_folder, thumb_name)
                    
                    try:
                        with PILImage.open(filepath) as pimg:
                            pimg.thumbnail((400, 400))
                            pimg.save(thumb_path, 'WEBP', quality=85)
                        
                        img.thumb_path = f'/uploads/{thumb_name}'
                        print(f"Created thumbnail for {img.filename}")
                    except Exception as e:
                        print(f"Failed to create thumbnail for {img.filename}: {e}")
        
        # 2. Process gallery images
        g_images = GalleryImage.query.all()
        for img in g_images:
            if not img.thumb_path:
                filepath = os.path.join(upload_folder, img.filename)
                if os.path.exists(filepath):
                    name, ext = os.path.splitext(img.filename)
                    thumb_name = f"thumb_{name}.webp"
                    thumb_path = os.path.join(upload_folder, thumb_name)
                    
                    try:
                        with PILImage.open(filepath) as pimg:
                            pimg.thumbnail((400, 400))
                            pimg.save(thumb_path, 'WEBP', quality=85)
                        
                        img.thumb_path = f'/uploads/{thumb_name}'
                        print(f"Created thumbnail for gallery image {img.filename}")
                    except Exception as e:
                        print(f"Failed to create thumbnail for gallery image {img.filename}: {e}")
        
        db.session.commit()
        print("Migration completed!")

if __name__ == "__main__":
    migrate()
