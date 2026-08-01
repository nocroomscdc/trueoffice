from flask import Flask, render_template, send_from_directory, request, jsonify
import os

from database import (
    init_db,
    get_users,
    add_user,
    get_messages
)


app = Flask(__name__)


# Database start
init_db()


@app.route("/")
def home():
    return render_template("chat.html")


@app.route("/login")
def login():
    return send_from_directory(".", "login.html")


# Users list
@app.route("/api/users", methods=["GET"])
def api_users():

    return jsonify({
        "users": get_users()
    })


# Add user
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
        "username": username,
        "users": get_users()

    })



# Chat history API
@app.route("/api/messages")
def api_messages():

    return jsonify({

        "messages": get_messages(500)

    })



if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        )

    )
