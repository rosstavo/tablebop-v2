const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-read-collaborative",
];

export const getAuthUrl = () => {
    return `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(
        SCOPES.join(" ")
    )}`;
};

export const getTokenFromUrl = () => {
    const hash = window.location.hash;
    let token = null;

    if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        token = params.get("access_token");

        if (token) {
            window.location.hash = "";
        }
    }

    return token;
};

export const fetchWebApi = async (
    endpoint,
    method = "GET",
    body = null,
    token
) => {
    const options = {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(
        `https://api.spotify.com/v1${endpoint}`,
        options
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
};
