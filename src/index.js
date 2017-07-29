import React, { Component } from 'react';
import SpotifyAPIHandler from './spotify-api-handler/spotify-api-handler';
import Login from './login/login';
import PlaylistPicker from './playlist-picker/playlist-picker';
import PlaylistStats from './playlist-stats/playlist-stats';
import ReactDOM from 'react-dom';
import './index.css';

class PlaylistatsApp extends Component {
  
  constructor(props) {
    super(props);
    this.apiHandler = new SpotifyAPIHandler();
    this.stats = null;
    this.state = {
      showError: false,
      showPlaylists: false,
      showStats: false,
      playlists: [],
      playlistImageURL: '',
    };

    this.login = this.login.bind(this);
    this.pickPlaylist = this.pickPlaylist.bind(this);

    if (window.location.hash !== "") {
      this.login();
    }
  };

  login(event) {
    if (this.apiHandler.authorize()) {
      this.getAndDisplayPlaylists();
    } else {
      this.setState({showError: true});
    }
  }

  getAndDisplayPlaylists() {
    this.apiHandler.getPlaylists().then((playlists) => {
      this.setState({showPlaylists: true});
      this.setState({playlists});
    }).catch((_) => this.setState({showError: true}));
  }

  pickPlaylist(href, image) {
    this.apiHandler.setPlaylistHref(href);
    this.setState({showPlaylists: false, showStats: true, playlistImageURL: image});
    this.apiHandler.getPlaylistTracks().then((tracks) => {
      this.apiHandler.getAudioFeatures().then((afs) => {
        this.apiHandler.getAlbums().then((albums) => {
          this.stats.generateSomeFunNumbers(tracks, afs, albums);
        }).catch((_) => this.setState({showError: true}));
      }).catch((_) => this.setState({showError: true}));
    }).catch((_) => this.setState({showError: true}));
  }

  render() {
    return (
      <div>
        <header><h1 className='title'>playlistats</h1></header>
        {!(this.state.showPlaylists || this.state.showStats) &&
          <Login onLogin={this.login} showError={this.state.showError}/>
        }
        {this.state.showPlaylists &&
          <PlaylistPicker visible={this.state.showPlaylists} playlists={this.state.playlists} onPickPlaylist={this.pickPlaylist}/>
        }
        {this.state.showStats &&
          <PlaylistStats ref={instance => { this.stats = instance; }} imageURL={this.state.playlistImageURL}/>
        }
        <footer>
          <div className='footer-content'>
            <p>Made with <span className='footer-heart'>&hearts;</span> by <a href="http://kolyanet.com" className='footer-link'>KolyaNet</a>.
            &emsp;&copy; {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    );
  }
}

ReactDOM.render(<PlaylistatsApp/>, document.getElementById('root'));