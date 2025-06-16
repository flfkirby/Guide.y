from flask import Flask, request, jsonify
from openai_utils import get_openai_response
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message")
    location = data.get("location", "")
    profile = data.get("profile", "")

    response = get_openai_response(user_input, location, profile)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
