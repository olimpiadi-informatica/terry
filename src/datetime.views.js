import React, { Component } from 'react';
import { DateTime, Duration } from "luxon";
import moment from "moment";
import { translateComponent } from "./utils";

export class DateView extends Component {
  render() {
    const { i18n } = this.props;
    const now = this.props.clock();
    return (
      <abbr title={this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}>
        { moment(this.props.date.toISO()).locale(i18n.language).from(moment(now.toISO())) }
      </abbr>
    );
  }
}

export class CountdownView extends Component {
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
    const now = this.props.clock();
    const remaining = this.props.end.diff(now);
    return <span> { remaining.toFormat("hh:mm:ss") } </span>
  }
}
