-- 前台注册用户与收藏夹（与后台管理员 admins 完全分开）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(120) NOT NULL UNIQUE,
    nickname VARCHAR(50),
    password_hash VARCHAR(256) NOT NULL,
    created_at DATETIME
);

CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jewelry_id INTEGER NOT NULL REFERENCES jewelry(id) ON DELETE CASCADE,
    created_at DATETIME,
    UNIQUE (user_id, jewelry_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_jewelry ON favorites(jewelry_id);
