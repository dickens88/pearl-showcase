-- 与原 Flask/SQLAlchemy 的表结构保持一致，方便以后导入旧的 database.sqlite 备份
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    created_at DATETIME
);

CREATE TABLE IF NOT EXISTS jewelry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    category VARCHAR(50) DEFAULT '耳饰',
    description TEXT,
    description_en TEXT,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    path VARCHAR(500) NOT NULL,
    thumb_path VARCHAR(500),
    jewelry_id INTEGER REFERENCES jewelry(id),
    description TEXT,
    description_en TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_images_jewelry ON images(jewelry_id);

CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_path VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    referrer VARCHAR(500),
    created_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);

CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_key VARCHAR(50) NOT NULL UNIQUE,
    content TEXT,
    updated_at DATETIME
);
INSERT OR IGNORE INTO pages (page_key, content) VALUES ('home', '{}'), ('about', '{}'), ('contact', '{}');

CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    path VARCHAR(500) NOT NULL,
    thumb_path VARCHAR(500),
    title VARCHAR(100),
    title_en VARCHAR(100),
    alt VARCHAR(200),
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT 1,
    created_at DATETIME
);
