import React, { Component } from 'react';

export default class YearGraph extends Component {
  render() {
    const currentYear = new Date().getFullYear();
    const years = this.props.years.reverse();
    const mostCommon = this.props.mostCommon;

    let bars = [];
    const width = Math.floor(450 / years.length - 2);
    let x = 50;

    for (let y of years) {
      const height = isNaN(y) ? 0 : Math.floor((y / mostCommon) * 400);
      x += width + 2;
      bars.push(<rect width={width} height={height} x={x} y={450 - height} fill='#660843'></rect>)
    }

    return (
      <svg className='year-graph' xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'>
        <g>{bars}</g>
        <g>
          <line x1='0' x2='500' y1='450' y2='450' stroke-width='2' stroke='#660843'/>
          <line x1='50' x2='50' y1='0' y2='500' stroke-width='2' stroke='#660843'/>
        </g>      
        <g>
          <text x='60' y='480' fill='#660843' font-size='20px'>{currentYear - years.length}</text>
          <text x='450' y='480' fill='#660843' font-size='20px'>{currentYear}</text>
          <text x={40 - (10 * mostCommon.toString().length)} y='50' fill='#660843' font-size='20px'>{mostCommon}</text>
          <text x='30' y='440' fill='#660843' font-size='20px'>0</text>
        </g>          
      </svg>
    );
  }
}