class SpotifyAPIHandler {

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

class Playlistats {

  constructor() {
    this.apiHandler = new SpotifyAPIHandler();
    this.loginButton = document.getElementsByClassName("login-button")[0];
    this.sections = {
      login: document.getElementsByClassName("login")[0],
      playlists: document.getElementsByClassName("playlists")[0],
      stats: document.getElementsByClassName("stats")[0]
    }
    this.pickerList = document.getElementsByClassName("playlists-list")[0];

    this.errorMessage = document.getElementsByClassName("error")[0];

    this.numbers = { 
      songCount: 0,
      longestSong: null, 
      longestLength: 0, 
      shortestSong: null, 
      shortestLength: Infinity, 
      mostPopularSong: null,
      totalDuration: 0, 
      averageDuration: 0,
      releaseYears: [],
      commonYear: 0,
      commonYearAmount: 0,
      dancey: false,
      energetic: false,
      acoustic: false,
      live: false,
      key: null
    };

    this.login = this.login.bind(this);
    this.pickPlaylist = this.pickPlaylist.bind(this);
    
    this.addEventListeners();

    this.currentYear = 0; 

    if (window.location.hash !== "") {
      this.login();
    }
  }

  addEventListeners() {
    this.loginButton.addEventListener("click", this.login);
    this.pickerList.addEventListener("click", this.pickPlaylist);
  }

  login(evt) {
    if (this.apiHandler.authorize()) {
      this.getAndDisplayPlaylists();
    } else {
      this.showAuthError();
    }
  }

  getAndDisplayPlaylists() {
    this.sections.login.style.display = 'none';
    this.sections.playlists.style.display = 'block';
    this.apiHandler.getPlaylists().then((playlists) => {
      for (let p of playlists) {
        const playlistNode = document.createElement("li");
        playlistNode.textContent = p.name;
        playlistNode.dataset.href = p.href;
        this.pickerList.appendChild(playlistNode);
      }
    }).catch((_) => this.showAuthError());
  }

  showAuthError() {
    this.sections.stats.style.display = 'none';
    this.sections.playlists.style.display = 'none';
    this.sections.login.style.display = 'block';
    this.errorMessage.style.display = 'block';
    window.location.hash = "";
  }

  pickPlaylist(evt) {
    let playlistHref = evt.target.dataset.href;
    this.apiHandler.setPlaylistHref(playlistHref);
    this.sections.playlists.style.display = "none";
    this.sections.stats.style.display = "flex";
    this.apiHandler.getPlaylistTracks().then((tracks) => {
      this.apiHandler.getAudioFeatures().then((afs) => {
        this.apiHandler.getAlbums().then((albums) => {
          this.generateSomeFunNumbers(tracks, afs, albums);
          this.generatePrettyStats();
          this.sections.stats.classList.remove('loading');
        }).catch((_) => this.showAuthError());
      }).catch((_) => this.showAuthError());
    }).catch((_) => this.showAuthError());
  }

  generateSomeFunNumbers(tracks, afs, albums) {

    this.numbers.songCount = tracks.length;
    let i = 0;
    let mostPopular = 0;
    let totalPopularity = 0;

    for (let t of tracks) {
      let duration = parseInt(t.duration_ms);
      let popularity = parseInt(t.popularity);
      totalPopularity += popularity;
      this.numbers.totalDuration += duration;
      if (duration > this.numbers.longestLength) {
        this.numbers.longestSong  = t.name;
        this.numbers.longestLength = duration;
      }
      if (duration < this.numbers.shortestLength) {
        this.numbers.shortestSong = t.name;
        this.numbers.shortestLength = duration;
      }
      if (popularity > mostPopular) {
        this.numbers.mostPopularSong = t.name;
        mostPopular = popularity;
      }
      i++;
    }

    this.numbers.averageDuration = this.numbers.totalDuration / tracks.length;
    this.numbers.averagePopularity = totalPopularity / tracks.length;
    console.log(this.numbers);
    this.numbers.longestLength = this.msToHMS(this.numbers.longestLength);
    this.numbers.shortestLength = this.msToHMS(this.numbers.shortestLength);
    this.numbers.totalDuration = this.msToHMS(this.numbers.totalDuration);
    this.numbers.averageDuration = this.msToHMS(this.numbers.averageDuration);  

    let totalDanceability = 0;
    let totalEnergy = 0;
    let totalAcousticness = 0;
    let totalLiveness = 0;
    let keys = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let af of afs) {
      totalDanceability += af.danceability;
      totalEnergy += af.energy;
      totalAcousticness += af.acousticness;
      totalLiveness += af.liveness;
      keys[af.key]++;
    }
    this.numbers.dancey = (totalDanceability / afs.length > 0.5);
    this.numbers.energetic = (totalEnergy / afs.length > 0.5);
    this.numbers.acoustic = (totalAcousticness / afs.length > 0.5);
    this.numbers.live = (totalLiveness / afs.length > 0.5);
    let commonKeyInt = keys.reduce((max, x, i, a) => x >= a[max] ? i : max, 0);
    const pitchClass = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]; 
    this.numbers.key = pitchClass[commonKeyInt];


    this.currentYear = new Date().getFullYear();
    let genres = {};
    console.log(albums);
    for (let a of albums) {
      let releaseYear = this.currentYear - parseInt(a.release_date.substr(0, 4));
      this.numbers.releaseYears[releaseYear] = (this.numbers.releaseYears[releaseYear] == undefined) ? 1 : this.numbers.releaseYears[releaseYear] + 1;
      for (let g of a.genres) {
        console.log(g);
        genres[g] = (genres[g] == undefined) ? 1 : genres[g] + 1;
      }
    }
    this.numbers.commonYearAmount = this.numbers.releaseYears.reduce((max, i) => { return (i > max) ? i : max; }, 0);
    this.numbers.commonYear = this.numbers.releaseYears.indexOf(this.numbers.commonYearAmount);
    console.log('Genres: ');
    console.log(genres);
  }
  
  msToHMS(ms) {
    let s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    s = Math.floor(s % 3600 % 60);
    return (h !== 0 ? h + "h " : "") + (m !== 0 ? m + "m " : "") + s + "s";
  }

  generatePrettyStats() {
    //This could be done quicker
    document.getElementsByClassName("js-stats-num-songs")[0].textContent = this.numbers.songCount;
    document.getElementsByClassName("js-stats-longest-song")[0].textContent = this.numbers.longestSong;
    document.getElementsByClassName("js-stats-longest-length")[0].textContent = this.numbers.longestLength;
    document.getElementsByClassName("js-stats-shortest-song")[0].textContent = this.numbers.shortestSong;
    document.getElementsByClassName("js-stats-shortest-length")[0].textContent = this.numbers.shortestLength;
    document.getElementsByClassName("js-stats-total-duration")[0].textContent = this.numbers.totalDuration;
    // document.getElementsByClassName("js-stats-most-popular-song")[0].textContent = this.numbers.mostPopularSong;
    document.getElementsByClassName("js-stats-common-year")[0].textContent = this.currentYear - this.numbers.commonYear;

    if (!this.numbers.dancey)
      document.getElementsByClassName("js-stats-dancey")[0].style.display = "none";   
    if (!this.numbers.energetic)
      document.getElementsByClassName("js-stats-energetic")[0].style.display = "none";
    if (!this.numbers.acoustic)
      document.getElementsByClassName("js-stats-acoustic")[0].style.display = "none";
    if (!this.numbers.live)
      document.getElementsByClassName("js-stats-live")[0].style.display = "none";
    
    const keyEls = document.getElementsByClassName("js-stats-key");
    keyEls[0].textContent = this.numbers.key;
    keyEls[1].textContent = this.numbers.key;    

    const yearGraph = document.getElementsByClassName("year-graph")[0];
    this.generateYearGraph(this.numbers.releaseYears.reverse(), this.numbers.commonYearAmount, yearGraph);
  }


  generateYearGraph(years, mostCommon, svg) {
    const rectGroup = svg.getElementsByTagName("g")[0];
    const texts = svg.getElementsByTagName("text");
    const width = Math.floor(450 / years.length - 2);
    const x = 50;

    for (let y of years) {
      const height = isNaN(y) ? 0 : Math.floor((y / mostCommon) * 400);
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttributeNS(null, "width", width);
      rect.setAttributeNS(null, "height", height);
      rect.setAttributeNS(null, "x", x);
      rect.setAttributeNS(null, "y", 450 - height);
      rect.setAttributeNS(null, "fill", "#660843");
      rectGroup.appendChild(rect);     
      x += width + 2;      
    }

    texts[0].textContent = this.currentYear - years.length;
    texts[1].textContent = this.currentYear;
    texts[2].textContent = mostCommon;
    texts[2].setAttributeNS(null, "x", 40 - (10 * mostCommon.toString().length));
  }
}

const app = new Playlistats();