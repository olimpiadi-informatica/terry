import React, { Component } from 'react';
import {translateComponent} from "../utils";

class CountdownView extends Component {
  constructor(props) {
    super(props);

    this.end = new Date();
    this.end.setSeconds(this.end.getSeconds() + props.remaining);
    this.tickrate = 1000;
    this.state = { time: "Loading..." };
  }

  componentWillMount() {
    this.timer = setInterval(this.tick.bind(this), this.tickrate);
    this.tick();
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  componentWillReceiveProps(props) {
    this.end = new Date();
    this.end.setSeconds(this.end.getSeconds() + props.remaining);
    this.tick();
  }

  clearInterval() {
    clearInterval(this.timer);
    delete this.timer;
  }

  tick() {
    const delta = (this.end - new Date()) / 1000;
    const { t } = this.props;

    if (delta <= 0) {
      if (this.timer) this.clearInterval();
      this.setState({ time: t("homepage.contest ended") });
      return;
    }

    const pad = (num) => num < 10 ? "0"+num : num;
    const s = pad((delta|0) % 60);
    const m = pad(((delta / 60) | 0) % 60);
    const h = pad((delta / 60 / 60) | 0);

    this.setState({ time: h + ":" + m + ":" + s });
  }

  render() {
    return <span>{this.state.time}</span>
  }
}

export default translateComponent(CountdownView);