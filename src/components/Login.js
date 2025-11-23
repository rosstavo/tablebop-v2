import React from "react";
import { getAuthUrl } from "../utils/spotify";
import "./Login.css";

const Login = () => {
    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Spotify Playlist Launcher</h1>
                <p>
                    Launch and control your Spotify playlists with smooth
                    transitions
                </p>
                <a href={getAuthUrl()} className="login-button">
                    Login with Spotify
                </a>
                <p className="login-note">
                    Note: Spotify Premium required for playback control
                </p>
            </div>
        </div>
    );
};

export default Login;
