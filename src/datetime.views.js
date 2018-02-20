import React, { Component } from 'react';
import { DateTime } from "luxon";
import moment from "moment";

class AutoRefreshView extends Component {
  componentDidMount() {
    this.timer = setInterval(() => this.forceUpdate(), this.props.rate);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }
  }

  render() {
    return this.props.render();
  }
}

export class DateView extends Component {
  render() {
    const { i18n } = this.props;
    return (
      <AutoRefreshView rate={30000} render={() => 
        <abbr title={this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}>
          { moment(this.props.date.toISO()).locale(i18n.language).from(moment(this.props.clock().toISO())) }
        </abbr>
      }/>
    );
  }
}

export class AbsoluteDateView extends Component {
  render() {
    const { i18n } = this.props;
    return (
      <AutoRefreshView rate={30000} render={() => 
        <abbr title={moment(this.props.date.toISO()).locale(i18n.language).from(moment(this.props.clock().toISO()))}>
          { this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS) }
        </abbr>
      }/>
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
    return <AutoRefreshView rate={30000} render={() =>
      this.props.end.diff(this.props.clock()).toFormat("hh:mm:ss")
    }/>
  }
}
