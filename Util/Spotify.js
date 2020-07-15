const clientId = 'a86d16308c16452db28f3c47e26dfee7';
const redirectURI = 'http://jamwithme.surge.sh';
let token = '';

const Spotify = {

    getAccessToken() {
        if(token) {
            return token;
        } 
        // Check for access token match in the url
        const tokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if(tokenMatch && expiresInMatch) {
            token = tokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);

            //Clear parameters , allowing us to grab a new access token when it expires
            window.setTimeout(() => token = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return token;
        } else {
            const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
            window.location = accessURL;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, 
        {headers: {
            Authorization: `Bearer ${accessToken}`
        }}).then(response => response.json()).then(jsonResponse => {
            if(!jsonResponse.tracks) {
                return [];
            }
           
            
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
            
        });
    },

    savePlaylist(name, trackURIs) {
        if(!name || !trackURIs) {
            return;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = {Authorization: `Bearer ${accessToken}`};
        let userId;
        return fetch(`https://api.spotify.com/v1/me`, {headers: headers}).then(response => response.json()).then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, 
            {headers: headers,
            method: 'POST',
            body: JSON.stringify({name: name})
            }).then( response => response.json()).then(jsonResponse => {
                const playlistId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, 
                {headers: headers,
                method: 'POST',
                body: JSON.stringify({uris: trackURIs})
                })
            })
        })
    }

};   

export default Spotify;