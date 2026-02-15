import sqlite3
import os

# 数据库文件路径
db_path = '/opt/pearl-showcase/server/instance/database.sqlite'
if not os.path.exists(db_path):
    # 尝试容器内的路径
    db_path = 'instance/database.sqlite'

def upgrade():
    if not os.path.exists(db_path):
        print(f"找不到数据库文件: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 为 images 表添加 thumb_path 列
    try:
        cursor.execute("ALTER TABLE images ADD COLUMN thumb_path TEXT")
        print("成功为 images 表添加 thumb_path 列")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("images 表已存在 thumb_path 列")
        else:
            print(f"更新 images 表失败: {e}")
            
    # 为 gallery_images 表添加 thumb_path 列
    try:
        cursor.execute("ALTER TABLE gallery_images ADD COLUMN thumb_path TEXT")
        print("成功为 gallery_images 表添加 thumb_path 列")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("gallery_images 表已存在 thumb_path 列")
        else:
            print(f"更新 gallery_images 表失败: {e}")
            
    conn.commit()
    conn.close()
    print("数据库升级完成！")

if __name__ == "__main__":
    upgrade()
