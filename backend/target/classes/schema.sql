-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- プリセットテーブル
CREATE TABLE IF NOT EXISTS presets (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_bpm INT NOT NULL,
    max_bpm INT NOT NULL,
    acc_interval INT NOT NULL,
    acc_amount INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- acc_mode カラムの追加 (既存テーブル向け)
ALTER TABLE presets ADD COLUMN IF NOT EXISTS acc_mode VARCHAR(20) DEFAULT 'bars';
