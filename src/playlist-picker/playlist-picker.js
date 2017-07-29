import React, {Component} from 'react';
import PlaylistItem from './playlist-item/playlist-item';

export default class PlaylistPicker extends Component {

  constructor(props) {
    super(props);
    this.onPlaylistClick = this.onPlaylistClick.bind(this);
  }

  onPlaylistClick(href, image) {
    this.props.onPickPlaylist(href, image);
  }

  render() {
    const rows = [];
    const playlists = this.props.playlists;

    for (let p of playlists) {
      rows.push(<PlaylistItem playlistHref={p.href} playlistImage={p.images[0].url} playlistName={p.name} onClick={this.onPlaylistClick}/>);
    }

    return (
      <section className='playlists'>
        <div className='playlists-picker'>
          <h3>Pick a Playlist</h3>
          <ul className='playlists-list'>{rows}</ul>
        </div>
      </section>
    );
  }
}
