export default class SpotifyAPIHandler {

  constructor() {
    this.accessToken = null;
    this.baseUrl = "https://api.spotify.com/v1/";
    this.userId = null;
    this.playlists = [];
    this.playlistHref = null;
    this.tracks = [];
    this.audioFeatures = [];
    this.albums = [];
    this.albumIds = [];
    this.trackIds = [];
  }

  performRequest(url) {
    const req = new XMLHttpRequest();
    const self = this;
    return new Promise(function(resolve, reject) {
      req.open("GET", url);
      if (self.accessToken !== null) {
        req.setRequestHeader("Authorization", "Bearer " + self.accessToken);
      }
      req.send(null);
      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          let data = null;
          if (req.status >= 200 && req.status < 300) {
            try {
              data = JSON.parse(req.responseText);
            } catch (error) {
              console.log(error);
            }
            resolve(data);
          } else reject(req.status);
        }
      };
    });
  }

  authorize() {
    const hash = window.location.hash;
    if (hash === "") {
      const baseUrl = "https://accounts.spotify.com/authorize";
      const clientId = "1d09353c8b944b23803baf657ec15e1e";
      const redirect = "http://www.playlistats.com/index.html";
      const scope = "playlist-read-private";
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem("state", state);
      let url = `${baseUrl}?client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&response_type=token&state=${state}`;
      window.location.replace(url);
    } else {
      // RegEx string for the returned hash - gets access token and given state value 
      const regExp = /#access_token=(.+)&token_type=Bearer&expires_in=(?:\d+)&state=(.+)/g;
      const matches = regExp.exec(hash);
      const state = matches[2];
      this.accessToken = matches[1];
      const localState = localStorage.getItem("state");
      if (state !== localState) {
        return false;
      }
      return true;
    }
  }

  getPlaylists(url) {
    if (url === undefined) url = `${this.baseUrl}me/playlists`;
    // Keep self for API Handler object
    const self = this;
    return new Promise(function(resolve, reject) {
      self.performRequest(url).then((data) => {
        console.log(data);
        self.userId = /users\/(.+)\//g.exec(data.href)[1];
        self.playlists = self.playlists.concat(data.items);
        resolve(data.next);
      })
      .catch((_) => {
        reject();
      });
    })
    .then((next) => {
      return next !== null ? self.getPlaylists(next) : self.playlists; 
    }).catch((_) => { return null; });
  }

  getPlaylistTracks(url) {
    if (url === undefined) url = `${this.playlistHref}/tracks`;
    const self = this;
    return new Promise(function(resolve, reject) {
      self.performRequest(url).then((data) => {
        for (let t of data.items) {
          self.tracks.push(t.track);
          self.trackIds.push(t.track.id);
          self.albumIds.push(t.track.album.id);
          resolve(data.next);
        }
      }).catch((_) => { reject(); });
    })
    .then((next) => {
      return next !== null ? self.getPlaylistTracks(next) : self.tracks;
    }).catch((_) => { return null; });
  }

  setPlaylistHref(href) {
    this.playlistHref = href;
  }

  getAudioFeatures() {
    let smallArrays = [];
    let promises = [];
    let self = this;
    for (let i = 0; i < this.trackIds.length; i += 100) {
      smallArrays.push(this.trackIds.slice(i, i + 100));
    }
    smallArrays.forEach((chunk) => {
      let url = `${this.baseUrl}audio-features?ids=${chunk.join(',')}`;
      promises.push(
        self.performRequest(url).then((data) => {
          self.audioFeatures = self.audioFeatures.concat(data.audio_features);
        })
      );
    });
    return new Promise(function(resolve, reject) {
      Promise.all(promises).then((_) => {
        resolve(self.audioFeatures);
      }).catch((_) => {
        reject();
      });
    });
  }

  getAlbums() {
    let smallArrays = [];
    let promises = [];
    let self = this;
    for (let i = 0; i < this.albumIds.length; i += 20) {
      smallArrays.push(this.albumIds.slice(i, i + 20));
    }
    smallArrays.forEach((chunk) => {
      let url = `${this.baseUrl}albums?ids=${chunk.join(',')}`;
      promises.push(
        self.performRequest(url).then((data) => {
          self.albums = self.albums.concat(data.albums);
        })
      );
    });
    return new Promise(function(resolve, reject) {
      Promise.all(promises).then((_) => {
        resolve(self.albums);
      }).catch((_) => {
        reject();
      });
    });
  }
}