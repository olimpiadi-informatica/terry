import { DateTime, Duration } from 'luxon';
import React, { Component } from 'react';
import { translateComponent } from '../utils';

class CountdownView extends Component {
  componentDidMount() {
    const tickrate = 1000;
    this.timer = setInterval(() => this.forceUpdate(), tickrate);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }
  }

  render() {
    const remaining = this.props.end.diff(DateTime.local().minus(this.props.delta));
    return <span> { remaining.toFormat("hh:mm:ss") } </span>
  }
}

export default translateComponent(CountdownView);
