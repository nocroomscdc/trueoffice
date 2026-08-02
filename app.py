from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit
import os

from database import (
    init_db,
    get_users,
    add_user,
    save_message,
    get_messages
)

app = Flask(__name__)
app.config["SECRET_KEY"] = "trueoffice"

socketio = SocketIO(
    app,
    cors_allowed_origins="*"
)

init_db()

online_users = {}


@app.route("/")
def home():
    return render_template("chat.html")


@app.route("/login")
def login():
    return send_from_directory(".", "login.html")


@app.route("/api/users")
def api_users():
    return jsonify({
        "users": get_users()
    })


@app.route("/api/messages")
def api_messages():
    return jsonify({
        "messages": get_messages(500)
    })


@app.route("/api/users", methods=["POST"])
def api_add_user():

    data = request.get_json(silent=True) or {}

    username = str(
        data.get("username", "")
    ).strip()

    if not username:
        return jsonify({
            "ok": False,
            "error": "Name required"
        }), 400

    if len(username) > 50:
        return jsonify({
            "ok": False,
            "error": "Name too long"
        }), 400

    if not add_user(username):
        return jsonify({
            "ok": False,
            "error": "User already exists"
        }), 409

    return jsonify({
        "ok": True,
        "users": get_users()
    })


@socketio.on("join")
def ws_join(data):

    username = str(
        data.get("username", "Guest")
    ).strip()

    if not username:
        username = "Guest"

    add_user(username)

    online_users[request.sid] = username

    emit(
        "history",
        {
            "messages": get_messages(500)
        }
    )

    socketio.emit(
        "users",
        {
            "users": list(online_users.values()),
            "all_users": get_users()
        }
    )


@socketio.on("message")
def ws_message(data):

    username = online_users.get(
        request.sid,
        "Guest"
    )

    text = str(
        data.get("text", "")
    ).strip()

    if not text:
        return

    message = save_message(
        username,
        text
    )

    socketio.emit(
        "message",
        message
    )


@socketio.on("disconnect")
def ws_disconnect():

    if request.sid in online_users:
        del online_users[request.sid]

    socketio.emit(
        "users",
        {
            "users": list(online_users.values()),
            "all_users": get_users()
        }
    )


if __name__ == "__main__":

    socketio.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
