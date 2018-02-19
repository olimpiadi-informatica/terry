import React, { Component } from 'react';
import { DateTime, Duration } from "luxon";
import moment from "moment";
import { translateComponent } from "./utils";

export class DateView extends Component {
  render() {
    const { i18n } = this.props;
    return (
      <abbr title={
        this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
      }>
        { moment(this.props.date.plus(this.props.delta).toISO()).locale(i18n.language).fromNow() }
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
    const remaining = this.props.end.diff(DateTime.local().minus(this.props.delta));
    return <span> { remaining.toFormat("hh:mm:ss") } </span>
  }
}
