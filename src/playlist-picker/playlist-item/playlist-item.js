import React, { Component } from 'react';

export default class PlaylistItem extends Component {

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.onClick(this.props.playlistHref, this.props.playlistImage);
  }
  
  render() {
    return <li className='playlist-item' onClick={this.onClick}>{this.props.playlistName}</li>
  }
}