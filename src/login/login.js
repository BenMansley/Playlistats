import React, {Component} from 'react';

export default class Login extends Component {

  constructor(props) {
    super(props);

    this.onLoginClick = this.onLoginClick.bind(this);
  }

  onLoginClick() {
    this.props.onLogin();
  }
  
  render() {
    return (
      <section className='login'>
        {this.props.showError && <h3 className='error' >An authentication error occured. This is usually due to a timeout. Please log in again</h3>}
        <button className='login-button' onClick={this.onLoginClick}>Login with Spotify</button>
      </section>
    );
  }
}