-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'zh-CN',
  markdown_plugins TEXT DEFAULT '{}',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Memo表
CREATE TABLE IF NOT EXISTS memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('PUBLIC','PRIVATE')) DEFAULT 'PRIVATE',
  pinned INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Memo与标签关联表
CREATE TABLE IF NOT EXISTS memo_tags (
  memo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (memo_id, tag_id),
  FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memo_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 全局设置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos(user_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_visibility ON memos(visibility);
CREATE INDEX IF NOT EXISTS idx_comments_memo_id ON comments(memo_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo_id ON memo_tags(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_tag_id ON memo_tags(tag_id);

-- 插入默认管理员用户 (admin/admin123)
INSERT OR IGNORE INTO users (username, password_hash, role) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'ADMIN');

-- 插入默认设置
INSERT OR IGNORE INTO settings (key, value) VALUES
('site_title', 'Memos Lite'),
('site_description', '轻量级备忘录系统'),
('allow_registration', 'false'),
('default_visibility', 'PRIVATE'); 