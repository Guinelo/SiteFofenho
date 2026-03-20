from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import os
from dotenv import load_dotenv
import time

load_dotenv()

app = Flask(__name__)
CORS(app)

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError("Credenciais do Spotify não encontradas no .env")

token_cache = {
    "access_token": None,
    "expires_at": 0
}

def get_token():
    if token_cache["access_token"] and time.time() < token_cache["expires_at"]:
        return token_cache["access_token"]

    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    }
    data = {"grant_type": "client_credentials"}

    r = requests.post(url, headers=headers, data=data)
    r.raise_for_status()

    response = r.json()

    token_cache["access_token"] = response["access_token"]
    token_cache["expires_at"] = time.time() + response["expires_in"] - 60 

    return token_cache["access_token"]

@app.route("/search")
def search():
    query = request.args.get("q")

    if not query:
        return jsonify({"error": "Query 'q' é obrigatória"}), 400

    try:
        token = get_token()

        url = f"https://api.spotify.com/v1/search?q={query}&type=track&limit=5"
        headers = {"Authorization": f"Bearer {token}"}

        r = requests.get(url, headers=headers)
        r.raise_for_status()

        data = r.json()

        tracks = []

        for t in data["tracks"]["items"]:
            tracks.append({
                "name": t["name"],
                "artists": [a["name"] for a in t["artists"]],
                "image": t["album"]["images"][0]["url"] if t["album"]["images"] else None,
                "id": t["id"]
            })

        return jsonify(tracks)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Erro ao acessar a API do Spotify", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)