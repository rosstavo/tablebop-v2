import React, { useState, useEffect } from "react";
import { fetchWebApi } from "../utils/spotify";
import SpotifyPlayer from "./SpotifyPlayer";
import "./Dashboard.css";

const Dashboard = ({ token, onLogout }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user profile
                const userProfile = await fetchWebApi(
                    "/me",
                    "GET",
                    null,
                    token
                );
                setUser(userProfile);

                // Fetch playlists
                const playlistData = await fetchWebApi(
                    "/me/playlists?limit=50",
                    "GET",
                    null,
                    token
                );
                setPlaylists(playlistData.items);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(
                    "Failed to load playlists. Please try logging in again."
                );
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading your playlists...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error">
                    <p>{error}</p>
                    <button onClick={onLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Spotify Playlist Launcher</h1>
                    {user && (
                        <p className="welcome-text">
                            Welcome, {user.display_name}!
                        </p>
                    )}
                </div>
                <button onClick={onLogout} className="logout-button">
                    Logout
                </button>
            </header>

            <SpotifyPlayer token={token} playlists={playlists} />
        </div>
    );
};

export default Dashboard;
