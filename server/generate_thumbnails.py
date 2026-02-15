import os
import sys
from PIL import Image as PILImage
from flask import Flask
from models import db, Image

# Set up paths
current_dir = os.path.dirname(os.path.abspath(__file__))
# server/uploads
upload_folder = os.path.join(current_dir, 'uploads')
# server/instance/database.sqlite
db_path = os.path.join(current_dir, 'instance', 'database.sqlite')

# Initialize app context to access DB
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = upload_folder
db.init_app(app)

def create_thumbnail(filepath, max_size=(400, 400), quality=80):
    """Generate thumbnail"""
    try:
        path_parts = filepath.rsplit('.', 1)
        thumb_path = f"{path_parts[0]}_thumb.{path_parts[1]}"
        
        # Check if thumbnail already exists
        if os.path.exists(thumb_path):
            return False
            
        with PILImage.open(filepath) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
            img.save(thumb_path, 'JPEG', quality=quality, optimize=True)
            print(f"Generated thumbnail: {thumb_path}")
            return True
    except Exception as e:
        print(f'Failed to generate thumbnail for {filepath}: {e}')
        return False

def main():
    with app.app_context():
        # Get all images
        images = Image.query.all()
        print(f"Found {len(images)} images in database.")
        
        count = 0
        for img in images:
            # Construct absolute file path
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], img.filename)
            
            if os.path.exists(filepath):
                if create_thumbnail(filepath):
                    count += 1
            else:
                print(f"File not found: {filepath}")
        
        print(f"Finished. Generated {count} new thumbnails.")

if __name__ == '__main__':
    main()
