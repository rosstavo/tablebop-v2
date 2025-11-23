import React, { useState, useEffect, useRef } from "react";
import Toast from "./Toast";
import "./SpotifyPlayer.css";

const SpotifyPlayer = ({ token, playlists }) => {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [currentPlaylist, setCurrentPlaylist] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [isFading, setIsFading] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const fadeIntervalRef = useRef(null);

    useEffect(() => {
        // Load Spotify SDK script dynamically
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        // Define the callback BEFORE adding the script to the DOM
        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: "Spotify Playlist Launcher",
                getOAuthToken: (cb) => {
                    cb(token);
                },
                volume: 1.0,
            });

            // Error handling
            spotifyPlayer.addListener("initialization_error", ({ message }) => {
                console.error("Initialization Error:", message);
            });

            spotifyPlayer.addListener("authentication_error", ({ message }) => {
                console.error("Authentication Error:", message);
            });

            spotifyPlayer.addListener("account_error", ({ message }) => {
                console.error("Account Error:", message);
            });

            spotifyPlayer.addListener("playback_error", ({ message }) => {
                console.error("Playback Error:", message);
            });

            // Ready
            spotifyPlayer.addListener("ready", ({ device_id }) => {
                console.log("Ready with Device ID", device_id);
                setDeviceId(device_id);
                setIsReady(true);
            });

            // Not Ready
            spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
                setIsReady(false);
            });

            spotifyPlayer.connect();
            setPlayer(spotifyPlayer);
        };

        // Add script to document only after callback is defined
        document.head.appendChild(script);

        // Cleanup
        return () => {
            if (player) {
                player.disconnect();
            }
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
            }
        };
    }, [token]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Shift") {
                setIsShiftPressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === "Shift") {
                setIsShiftPressed(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const handleApiCall = async (url, options) => {
        const response = await fetch(url, options);

        if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || "a few";
            setToastMessage(
                `You're being rate limited by Spotify. Please try again in ${retryAfter} seconds.`
            );
            throw new Error("Rate limited");
        }

        return response;
    };

    const fadeOutAndPlay = async (playlistUri, shuffle = false) => {
        if (!player || !deviceId || isFading) return;

        try {
            setIsFading(true);

            // Get current state
            const state = await player.getCurrentState();

            if (state && !state.paused) {
                // Fade out over 3 seconds
                const fadeSteps = 30; // 100ms intervals
                const fadeDuration = 3000; // 3 seconds
                const volumeStep = 100 / fadeSteps; // Volume in percentage
                let currentVolume = 100;

                await new Promise((resolve) => {
                    fadeIntervalRef.current = setInterval(async () => {
                        currentVolume -= volumeStep;

                        if (currentVolume <= 0) {
                            clearInterval(fadeIntervalRef.current);
                            fadeIntervalRef.current = null;
                            // Set volume to 0 via API
                            await handleApiCall(
                                `https://api.spotify.com/v1/me/player/volume?volume_percent=0`,
                                {
                                    method: "PUT",
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                            await player.pause();
                            resolve();
                        } else {
                            // Set volume via API
                            await handleApiCall(
                                `https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.floor(
                                    currentVolume
                                )}`,
                                {
                                    method: "PUT",
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                        }
                    }, fadeDuration / fadeSteps);
                });
            }

            // Start new playlist at max volume
            console.log("Starting playback with shuffle:", shuffle);
            await handleApiCall(
                `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        context_uri: playlistUri,
                        position_ms: 0,
                    }),
                }
            );

            // Wait for playback to start
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Set shuffle state AFTER playback has started on the device
            console.log("Now setting shuffle to:", shuffle);
            const shuffleResponse = await handleApiCall(
                `https://api.spotify.com/v1/me/player/shuffle?state=${shuffle}&device_id=${deviceId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Shuffle response status:", shuffleResponse.status);

            // Set to max volume via API
            await handleApiCall(
                `https://api.spotify.com/v1/me/player/volume?volume_percent=100`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCurrentPlaylist(playlistUri);
            setIsFading(false);
        } catch (error) {
            console.error("Error during playback transition:", error);
            setIsFading(false);
        }
    };

    const playInstantly = async (playlistUri, shuffle = true) => {
        if (!player || !deviceId) return;

        try {
            // Start new playlist immediately
            console.log("Starting instant playback with shuffle:", shuffle);
            await handleApiCall(
                `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        context_uri: playlistUri,
                        position_ms: 0,
                    }),
                }
            );

            // Wait for playback to start
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Set shuffle state
            console.log("Now setting shuffle to:", shuffle);
            await handleApiCall(
                `https://api.spotify.com/v1/me/player/shuffle?state=${shuffle}&device_id=${deviceId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Set to max volume via API
            await handleApiCall(
                `https://api.spotify.com/v1/me/player/volume?volume_percent=100`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCurrentPlaylist(playlistUri);
        } catch (error) {
            console.error("Error during instant playback:", error);
        }
    };

    const handlePlaylistClick = (playlist, event) => {
        if (!isReady) {
            alert("Player is not ready yet. Please wait a moment.");
            return;
        }

        const instantPlay = event.shiftKey;
        const shuffle = !instantPlay; // Shuffle ON by default, OFF when shift is pressed

        console.log("Shift key pressed:", instantPlay, "Shuffle:", shuffle);

        if (instantPlay) {
            // Instant play without fade, no shuffle
            playInstantly(playlist.uri, false);
        } else {
            // Normal fade with shuffle
            fadeOutAndPlay(playlist.uri, shuffle);
        }
    };

    const fadeOutAndStop = async () => {
        if (!player || isFading) return;

        try {
            setIsFading(true);

            // Get current state
            const state = await player.getCurrentState();

            if (state && !state.paused) {
                // Fade out over 3 seconds
                const fadeSteps = 30;
                const fadeDuration = 3000;
                const volumeStep = 100 / fadeSteps;
                let currentVolume = 100;

                await new Promise((resolve) => {
                    fadeIntervalRef.current = setInterval(async () => {
                        currentVolume -= volumeStep;

                        if (currentVolume <= 0) {
                            clearInterval(fadeIntervalRef.current);
                            fadeIntervalRef.current = null;
                            await handleApiCall(
                                `https://api.spotify.com/v1/me/player/volume?volume_percent=0`,
                                {
                                    method: "PUT",
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                            await player.pause();
                            resolve();
                        } else {
                            await handleApiCall(
                                `https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.floor(
                                    currentVolume
                                )}`,
                                {
                                    method: "PUT",
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );
                        }
                    }, fadeDuration / fadeSteps);
                });
            }

            setCurrentPlaylist(null);
            setIsFading(false);
        } catch (error) {
            console.error("Error during fade out and stop:", error);
            setIsFading(false);
        }
    };

    if (!isReady) {
        return (
            <div className="player-container">
                <div className="player-loading">
                    <p>Initializing Spotify Player...</p>
                    <p className="player-note">
                        Please make sure you have Spotify Premium
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="player-container">
            <div className="playlist-grid">
                {playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        className={`playlist-card ${
                            currentPlaylist === playlist.uri ? "active" : ""
                        } ${isFading ? "disabled" : ""}`}
                        onClick={(e) => handlePlaylistClick(playlist, e)}
                    >
                        {playlist.images && playlist.images[0] && (
                            <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="playlist-image"
                            />
                        )}
                        <div className="playlist-info">
                            <h3 className="playlist-name">{playlist.name}</h3>
                            <p className="playlist-tracks">
                                {playlist.tracks.total} tracks
                            </p>
                            {currentPlaylist === playlist.uri && (
                                <span className="now-playing">Now Playing</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="stop-control">
                <button
                    className={`stop-button ${isFading ? "disabled" : ""}`}
                    onClick={fadeOutAndStop}
                    disabled={isFading}
                >
                    Stop Playback
                </button>
            </div>

            {isFading && (
                <div className="fade-indicator">Transitioning playlists...</div>
            )}

            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type="error"
                    onClose={() => setToastMessage(null)}
                />
            )}
        </div>
    );
};

export default SpotifyPlayer;
