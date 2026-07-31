import sqlite3
import os
from pathlib import Path

DB_PATH = Path(os.environ.get("DB_PATH", "trueoffice.db"))


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL COLLATE NOCASE UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def add_user(username):
    username = str(username).strip()

    if not username:
        return False

    conn = get_connection()

    try:
        conn.execute(
            "INSERT INTO users (username) VALUES (?)",
            (username,)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_users():
    conn = get_connection()

    rows = conn.execute("""
        SELECT username
        FROM users
        ORDER BY username COLLATE NOCASE
    """).fetchall()

    conn.close()

    return [row["username"] for row in rows]


def save_message(username, text):
    conn = get_connection()

    cur = conn.execute("""
        INSERT INTO messages (username, text)
        VALUES (?, ?)
    """, (username, text))

    conn.commit()
    message_id = cur.lastrowid

    row = conn.execute("""
        SELECT id, username, text, created_at
        FROM messages
        WHERE id = ?
    """, (message_id,)).fetchone()

    conn.close()

    return dict(row)


def get_messages(limit=500):
    conn = get_connection()

    rows = conn.execute("""
        SELECT id, username, text, created_at
        FROM messages
        ORDER BY id DESC
        LIMIT ?
    """, (int(limit),)).fetchall()

    conn.close()

    messages = [dict(row) for row in rows]
    messages.reverse()

    return messages


init_db()
