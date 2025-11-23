import React, { useState, useEffect } from "react";
import { getTokenFromUrl } from "./utils/spotify";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
    const [token, setToken] = useState(null);

    useEffect(() => {
        // Check for token in URL hash (OAuth callback)
        const tokenFromUrl = getTokenFromUrl();

        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            sessionStorage.setItem("spotify_token", tokenFromUrl);
        } else {
            // Check for existing token in session storage
            const savedToken = sessionStorage.getItem("spotify_token");
            if (savedToken) {
                setToken(savedToken);
            }
        }
    }, []);

    const handleLogout = () => {
        setToken(null);
        sessionStorage.removeItem("spotify_token");
        window.location.href = "/";
    };

    return (
        <div className="App">
            {!token ? (
                <Login />
            ) : (
                <Dashboard token={token} onLogout={handleLogout} />
            )}
        </div>
    );
}

export default App;
