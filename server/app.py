from flask import Flask, request, jsonify
import sqlite3
import json
import hashlib

app = Flask(__name__)
DB = 'users.db'

def init_db():
    conn = sqlite3.connect(DB)
    conn.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        data TEXT
    )
    ''')
    conn.commit()
    conn.close()

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

init_db()

@app.route('/sync', methods=['POST'])
def sync():
    try:
        req = request.get_json()    
        username = req.get('username')
        password = req.get('password')
        data = req.get('data', {})

        if not username or not password or data is None:
            return jsonify({'error': 'Missing fields'}), 400
            
        with sqlite3.connect(DB, timeout=5) as conn:
            cursor = conn.execute(
                'SELECT password FROM users WHERE username = ?',
                (username,)
            )
            row = cursor.fetchone()

            if row and row[0] == hash_pw(password):
                conn.execute(
                    'UPDATE users SET data = ? WHERE username = ?',
                    (data, username)
                )
                conn.commit()
                return jsonify({'status': 'synced'}), 200
            else:
                return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    try:
        req = request.get_json()
        username = req.get('username')
        password = req.get('password')
        data = req.get('data', {})

        if not username or not password:
            return jsonify({'error': 'Missing fields'}), 400

        with sqlite3.connect(DB, timeout=5) as conn:
            conn.execute(
                'INSERT INTO users (username, password, data) VALUES (?, ?, ?)',
                (username, hash_pw(password), data)
            )
            conn.commit()

        return jsonify({'status': 'ok'}), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    req = request.get_json()    
    username = req.get('username')
    password = req.get('password')

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute('SELECT data, password FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()

    if row and row[1] == hash_pw(password):
        return jsonify(row[0])
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

if __name__ == '__main__':
    app.run(port=3000)
