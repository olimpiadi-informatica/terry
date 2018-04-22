import * as React from 'react';
import { DateTime } from "luxon";
import * as moment from "moment";
import { InjectedI18nProps, InjectedTranslateProps } from 'react-i18next';

type Props = {
  rate: number
  render: () => React.ReactNode
}

class AutoRefreshView extends React.Component<Props> {
  timer?: NodeJS.Timer;

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

type DateViewProps = {
  date: DateTime
  clock: () => DateTime
} & InjectedI18nProps

export class DateView extends React.Component<DateViewProps> {
  render() {
    const { i18n } = this.props;
    return (
      <AutoRefreshView rate={30000} render={() =>
        <abbr title={this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}>
          {moment(this.props.date.toISO()).locale(i18n.language).from(moment(this.props.clock().toISO()))}
        </abbr>
      } />
    );
  }
}

export class AbsoluteDateView extends React.Component<DateViewProps> {
  render() {
    const { i18n } = this.props;
    return (
      <AutoRefreshView rate={30000} render={() =>
        <abbr title={moment(this.props.date.toISO()).locale(i18n.language).from(moment(this.props.clock().toISO()))}>
          {this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
        </abbr>
      } />
    );
  }
}

type CountDownProps = {
  end: DateTime
  clock: () => DateTime
  afterEnd?: React.ReactNode
} & InjectedTranslateProps

export class CountdownView extends React.Component<CountDownProps> {
  timer?: NodeJS.Timer;

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
    const { t } = this.props

    return <AutoRefreshView rate={30000} render={() =>
      this.props.end.diff(this.props.clock()).as("milliseconds") < 0 ?
        t("contest finished") :
        this.props.end.diff(this.props.clock()).toFormat("hh:mm:ss")
    } />
  }
}
