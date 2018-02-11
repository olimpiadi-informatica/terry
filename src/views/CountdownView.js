import moment from 'moment';
import countdown from 'countdown';
import React, { Component } from 'react';
import { translateComponent } from '../utils';

class CountdownView extends Component {
  constructor(props) {
    super(props);

    this.end = moment();
    this.end.add(props.remaining, 'seconds');

    this.tickrate = 1000;
  }

  componentDidMount() {
    this.timer = setInterval(() => this.tick(), this.tickrate);
  }
  
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }
  }
  
  tick() {
    this.forceUpdate();
  }

  render() {
    let remaining = moment.duration(
      this.props.end * 1000 - moment().utc() - this.props.delta,
      'milliseconds'
    );

    const pad = (num) => (num < 10 ? "0" : "") + num;

    const s = pad(remaining.seconds());
    const m = pad(remaining.minutes());
    const h = pad(remaining.asHours() | 0);

    return <span> { h + ":" + m + ":" + s } </span>
  }
}

export default translateComponent(CountdownView);