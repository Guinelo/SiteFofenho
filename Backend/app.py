from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64

app = Flask(__name__)
CORS(app)

CLIENT_ID = "09716a56cf7a49fa925f9d3cd81ad7a0"
CLIENT_SECRET = "80eff147956444a081b3aad236632943"

def get_token():
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    }
    data = {"grant_type": "client_credentials"}
    r = requests.post(url, headers=headers, data=data)
    return r.json()["access_token"]

@app.route("/search")
def search():
    query = request.args.get("q")

    token = get_token()

    url = f"https://api.spotify.com/v1/search?q={query}&type=track&limit=5"
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(url, headers=headers)
    data = r.json()

    tracks = []

    for t in data["tracks"]["items"]:
        tracks.append({
            "name": t["name"],
            "artists": [a["name"] for a in t["artists"]],
            "image": t["album"]["images"][0]["url"],
            "id": t["id"]
        })

    return jsonify(tracks)

if __name__ == "__main__":
    app.run(debug=True)