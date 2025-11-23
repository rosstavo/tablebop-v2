import React, { useState, useEffect } from "react";
import "./Settings.css";

const Settings = ({ playlists, selectedPlaylists, onSave, onClose }) => {
    const [selected, setSelected] = useState(new Set(selectedPlaylists));
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPlaylists = playlists.filter((playlist) =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const togglePlaylist = (playlistId) => {
        const newSelected = new Set(selected);
        if (newSelected.has(playlistId)) {
            newSelected.delete(playlistId);
        } else {
            newSelected.add(playlistId);
        }
        setSelected(newSelected);
    };

    const selectAll = () => {
        setSelected(new Set(playlists.map((p) => p.id)));
    };

    const deselectAll = () => {
        setSelected(new Set());
    };

    const handleSave = () => {
        onSave(Array.from(selected));
        onClose();
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div
                className="settings-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-header">
                    <h2>Select Playlists</h2>
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="settings-controls">
                    <input
                        type="text"
                        placeholder="Search playlists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <div className="bulk-actions">
                        <button onClick={selectAll} className="bulk-button">
                            Select All
                        </button>
                        <button onClick={deselectAll} className="bulk-button">
                            Deselect All
                        </button>
                        <span className="selection-count">
                            {selected.size} of {playlists.length} selected
                        </span>
                    </div>
                </div>

                <div className="playlist-list">
                    {filteredPlaylists.map((playlist) => (
                        <div
                            key={playlist.id}
                            className={`playlist-item ${
                                selected.has(playlist.id) ? "selected" : ""
                            }`}
                            onClick={() => togglePlaylist(playlist.id)}
                        >
                            <input
                                type="checkbox"
                                checked={selected.has(playlist.id)}
                                onChange={() => {}}
                                className="playlist-checkbox"
                            />
                            {playlist.images && playlist.images[0] && (
                                <img
                                    src={playlist.images[0].url}
                                    alt={playlist.name}
                                    className="playlist-thumbnail"
                                />
                            )}
                            <div className="playlist-details">
                                <span className="playlist-item-name">
                                    {playlist.name}
                                </span>
                                <span className="playlist-item-tracks">
                                    {playlist.tracks.total} tracks
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="settings-footer">
                    <button onClick={onClose} className="cancel-button">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="save-button">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
