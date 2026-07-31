from flask import Flask, render_template, send_from_directory, request, jsonify
import sqlite3
import os
from database import init_db, get_users, add_user, get_messages

app = Flask(__name__)

DB_PATH = "/opt/trueoffice/trueoffice.db"

init_db()


@app.route("/")
def home():
    return render_template("chat.html")


@app.route("/login")
def login():
    return send_from_directory("/opt/trueoffice", "login.html")


@app.route("/api/users", methods=["GET"])
def api_users():
    return jsonify({
        "users": get_users()
    })


@app.route("/api/users", methods=["POST"])
def api_add_user():
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()

    if not username:
        return jsonify({
            "ok": False,
            "error": "Name is required"
        }), 400

    if len(username) > 50:
        return jsonify({
            "ok": False,
            "error": "Name is too long"
        }), 400

    if not add_user(username):
        return jsonify({
            "ok": False,
            "error": "User already exists"
        }), 409

    return jsonify({
        "ok": True,
        "username": username,
        "users": get_users()
    })


@app.route("/api/messages", methods=["GET"])
def api_messages():
    return jsonify({
        "messages": get_messages(500)
    })


if __name__ == "__main__":
    app.run(
    host="0.0.0.0",
    port=int(os.environ.get("PORT", 5000))
)
