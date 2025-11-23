import React, { useState, useEffect } from "react";
import { fetchWebApi } from "../utils/spotify";
import SpotifyPlayer from "./SpotifyPlayer";
import Settings from "./Settings";
import "./Dashboard.css";

const Dashboard = ({ token, onLogout }) => {
    const [allPlaylists, setAllPlaylists] = useState([]);
    const [selectedPlaylistIds, setSelectedPlaylistIds] = useState(null); // null = not loaded yet
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // Load selected playlists from cookie on mount
    useEffect(() => {
        const savedIds = getCookie("selectedPlaylists");
        if (savedIds) {
            try {
                const parsed = JSON.parse(decodeURIComponent(savedIds));
                console.log("Loaded saved playlist IDs:", parsed);
                setSelectedPlaylistIds(parsed);
            } catch (e) {
                console.error("Error parsing saved playlists:", e);
                setSelectedPlaylistIds([]);
            }
        } else {
            console.log("No saved playlists found");
            setSelectedPlaylistIds([]);
        }
    }, []);

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    };

    const setCookie = (name, value, days = 365) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        const encodedValue = encodeURIComponent(value);
        document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/`;
        console.log("Saved cookie:", name, value);
    };

    useEffect(() => {
        // Only fetch playlists if selectedPlaylistIds has been initialized from cookie
        if (selectedPlaylistIds === null) return;

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

                // Fetch ALL playlists (paginate through all results)
                let allPlaylistsData = [];
                let url = "/me/playlists?limit=50";

                while (url) {
                    const playlistData = await fetchWebApi(
                        url.replace("https://api.spotify.com/v1", ""),
                        "GET",
                        null,
                        token
                    );
                    allPlaylistsData = [
                        ...allPlaylistsData,
                        ...playlistData.items,
                    ];
                    url = playlistData.next; // Get next page URL or null if no more pages
                }

                setAllPlaylists(allPlaylistsData);

                // If no saved selection, select all by default
                if (selectedPlaylistIds.length === 0) {
                    const allIds = allPlaylistsData.map((p) => p.id);
                    setSelectedPlaylistIds(allIds);
                    setCookie("selectedPlaylists", JSON.stringify(allIds));
                    console.log("No saved selection, selecting all playlists");
                }

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
    }, [token, selectedPlaylistIds]);

    const handleSaveSettings = (newSelectedIds) => {
        console.log("Saving new selected IDs:", newSelectedIds);
        setSelectedPlaylistIds(newSelectedIds);
        setCookie("selectedPlaylists", JSON.stringify(newSelectedIds));
    };

    const filteredPlaylists = allPlaylists.filter(
        (p) => selectedPlaylistIds && selectedPlaylistIds.includes(p.id)
    );

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
                <div className="header-actions">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="settings-button"
                    >
                        ⚙️ Settings
                    </button>
                    <button onClick={onLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            <SpotifyPlayer token={token} playlists={filteredPlaylists} />

            {showSettings && (
                <Settings
                    playlists={allPlaylists}
                    selectedPlaylists={selectedPlaylistIds}
                    onSave={handleSaveSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;
