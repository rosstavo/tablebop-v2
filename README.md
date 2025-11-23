# Spotify Playlist Launcher

A React application that uses the Spotify Web Playback SDK to launch and control playlists with smooth fade transitions.

## Features

-   OAuth 2.0 authentication with Spotify
-   Display user's playlists
-   Launch playlists with Web Playback SDK
-   3-second fade-out transition between playlists
-   Automatic max volume on new playlist launch

## Setup

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in and create a new app
3. Add `http://localhost:3000/callback` to the Redirect URIs in your app settings
4. Note your Client ID

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Edit `.env` and add your Spotify Client ID:
    ```
    REACT_APP_SPOTIFY_CLIENT_ID=your_actual_client_id
    REACT_APP_REDIRECT_URI=http://localhost:3000/callback
    ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Usage

1. Click "Login with Spotify" to authenticate
2. Select a playlist from your list
3. Click on a playlist to start playback
4. Switch between playlists - the app will fade out the current one over 3 seconds and launch the new one at max volume

## Required Spotify Scopes

-   `streaming`: Control playback on your devices
-   `user-read-email`: Read your email address
-   `user-read-private`: Access your subscription details
-   `user-read-playback-state`: Read your currently playing content
-   `user-modify-playback-state`: Control playback on your devices
-   `playlist-read-private`: Access your private playlists
-   `playlist-read-collaborative`: Access your collaborative playlists

## Notes

-   You need a Spotify Premium account to use the Web Playback SDK
-   The app creates a new playback device called "Spotify Playlist Launcher"
