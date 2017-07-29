import React, { Component } from 'react';
import YearGraph from './year-graph/year-graph';

export default class PlaylistStats extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      numbers: {}
    };
  }

  msToHMS(ms) {
    let s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    s = Math.floor(s % 3600 % 60);
    return (h !== 0 ? h + "h " : "") + (m !== 0 ? m + "m " : "") + s + "s";
  }

  generateSomeFunNumbers(tracks, afs, albums) {
    let numbers = {
      songCount: 0,
      longestSong: null, 
      longestLength: 0, 
      shortestSong: null, 
      shortestLength: Infinity, 
      totalDuration: 0, 
      mostPopularSong: null,
      averagePopularity: 0,
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

    numbers.songCount = tracks.length;
    let mostPopular = 0;
    let totalPopularity = 0;

    for (let t of tracks) {
      let duration = parseInt(t.duration_ms, 10);
      let popularity = parseInt(t.popularity, 10);
      totalPopularity += popularity;
      numbers.totalDuration += duration;
      if (duration > numbers.longestLength) {
        numbers.longestSong  = t.name;
        numbers.longestLength = duration;
      }
      if (duration < numbers.shortestLength) {
        numbers.shortestSong = t.name;
        numbers.shortestLength = duration;
      }
      if (popularity > mostPopular) {
        numbers.mostPopularSong = t.name;
        mostPopular = popularity;
      }
    }

    numbers.averageDuration = numbers.totalDuration / tracks.length;
    numbers.averagePopularity = totalPopularity / tracks.length;

    numbers.longestLength = this.msToHMS(numbers.longestLength);
    numbers.shortestLength = this.msToHMS(numbers.shortestLength);
    numbers.totalDuration = this.msToHMS(numbers.totalDuration);
    numbers.averageDuration = this.msToHMS(numbers.averageDuration);  

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
    numbers.dancey = (totalDanceability / afs.length > 0.5);
    numbers.energetic = (totalEnergy / afs.length > 0.5);
    numbers.acoustic = (totalAcousticness / afs.length > 0.5);
    numbers.live = (totalLiveness / afs.length > 0.5);
    let commonKeyInt = keys.reduce((max, x, i, a) => x >= a[max] ? i : max, 0);
    const pitchClass = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]; 
    numbers.key = pitchClass[commonKeyInt];

    this.currentYear = new Date().getFullYear();
    // let genres = {};
    for (let a of albums) {
      let releaseYear = new Date().getFullYear() - parseInt(a.release_date.substr(0, 4), 10);
      numbers.releaseYears[releaseYear] = (numbers.releaseYears[releaseYear] === undefined) ? 1 : numbers.releaseYears[releaseYear] + 1;
    }
    numbers.commonYearAmount = numbers.releaseYears.reduce((max, i) => { return (i > max) ? i : max; }, 0);
    numbers.commonYear = numbers.releaseYears.indexOf(numbers.commonYearAmount);
    
    this.setState({numbers, loading: false});
  }

  render() {
    const numbers = this.state.numbers;
    const popularityTexts = ['Looks like your music taste is pretty obscure!', 'You clearly don\'t always follow the trend!',
      'Lots of people are loving what you\'re listening to!', 'Lots of people are loving what you\'re listening to!'];
    const popularityText = popularityTexts[Math.floor((numbers.averagePopularity - 1) / 25)];

    return (
      <div className={`stats${(this.state.loading ? ' loading' : '')}`}>
        <img src='img/load-icon.svg' className='stats-loading-icon' alt='loading'/>
        <section className='stats-durations'>
          <p>
            Your playlist has <span className='stats-emphasis'>{numbers.songCount}</span> songs with a total duration of 
            <span className='stats-emphasis'>{numbers.totalDuration}</span>
          </p>
          <p>
            The shortest song is <span className='stats-small'>{numbers.shortestSong}</span> with a duration of
            <span className='stats-small'>{numbers.shortestLength}</span><span className='stats-divider'>, </span>
            and the longest song is <span className='stats-small'>{numbers.longestSong}</span> with a duration of
            <span className='stats-small'>{numbers.longestLength}</span><span className='stats-divider'>.</span>
          </p>
        </section>
        <section className='stats-analysis'>
          <p>Your song choice shows you like...</p>
          <div className='stats-analysis-wrap'>
            <div className='stats-features'>
              { numbers.dancey &&
              <div className='stats-feature js-stats-dancey'>
                <img className='feature-icon' src='img/dance-icon.svg' alt='Dancey'/>            
                <span>Dance Music</span>
              </div>
              }
              { numbers.acoustic &&
              <div className='stats-feature js-stats-acoustic'>
                <img className='feature-icon' src='img/acoustic-icon.svg' alt='Acoustic'/>
                <span>Acoustic Music</span>
              </div>
              }
              { numbers.energetic &&
              <div className='stats-feature js-stats-energetic'>
                <img className='feature-icon' src='img/energy-icon.svg' alt='Energetic'/>
                <span>Music with Energy</span>
              </div>
              }
              { numbers.live &&
              <div className='stats-feature js-stats-live'>
                <img className='feature-icon' src='img/live-icon.svg' alt='Live'/>
                <span>Live Music</span>
              </div>
              }
            </div>
            <div className='stats-key'>
              <h3 className='stats-emphasis stats-big-key'>{numbers.key}</h3>
              <p className='stats-key-desc'>The playlist contained songs mostly in the key of {numbers.key}</p>
            </div>
          </div>
        </section>
        <section className='stats-years'>
          <p>This playlist mostly contains songs from the year
            <span className='stats-emphasis'> { new Date().getFullYear() - numbers.commonYear }</span></p>
          <YearGraph years={numbers.releaseYears || []} mostCommon={numbers.commonYearAmount || 0}/>
        </section>
        <section className='stats-popularity'>
          <p className='stats-popularity-description'>{popularityText || ''}</p>
          <p>The most popular song in your playlist is <span className='stats-emphasis'>{numbers.mostPopularSong}</span></p>
        </section>
        <section className='stats-image'>
          <img src={this.props.imageURL} alt="Playlist Image"/>
        </section>
      </div>
    );
  }
}