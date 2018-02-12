import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import CountdownView from '../CountdownView';
import { DateTime, Duration } from 'luxon';
import DateView from '../DateView';
import Logs from '../../models/admin/Logs';
import Users from '../../models/admin/Users';

class AdminSummaryView extends Component {
  constructor(props) {
    super(props);
    this.session = props.session;
    this.logs = new Logs(this.session);
  }

  componentWillMount() {
    this.logs.load({
      start_date: "1000-01-01T00:00:00.000",
      end_date: "2999-01-01T00:00:00.000",
      level: "WARNING",
    });
    this.session.users.load();
  }

  componentDidMount() {
    this.session.pushObserver(this);
    this.logs.pushObserver(this);

    const tickrate = 1000;
    this.timer = setInterval(() => this.forceUpdate(), tickrate);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }

    this.session.popObserver(this);
    this.logs.popObserver(this);
  }

  renderContestStatus() {
    if (!this.session.status.start_time)
      return this.renderNotStarted();

    // WIP
    return this.renderStartButton();
  }

  renderStarted() {
    const { t, i18n } = this.props;
    return <React.Fragment>
      <dt>
        <span className="fa fa-clock-o" aria-hidden="true" />
        {' '}
        {t("contest.started at")}
      </dt>
      <dd>{
        DateTime.fromISO(this.session.status.start_time).setLocale(i18n.language).toLocaleString(
          DateTime.DATETIME_SHORT
        )
      }</dd>
    </React.Fragment>;
  }

  renderStartButton() {
    const { t } = this.props;
    return <React.Fragment>
      <p>{t("contest.not started")}</p>
      <form ref="form" onSubmit={(e) => { e.preventDefault(); this.session.startContest(); }}>
        <button type="submit" className="btn btn-primary">
          <span className="fa fa-play" aria-hidden="true" /> {t("contest.start")}
        </button>
      </form>
    </React.Fragment>;
  }

  renderOfficialCountdown() {
    const { t, i18n } = this.props;
    const officialEndTime = DateTime.fromISO(this.session.status.end_time);
    
    // FIXME: delta=0 ????
    return <React.Fragment>
      <dt>
        <span className="fa fa-clock-o" aria-hidden="true" />
        {' '}
        {t("contest.remaining time")}
      </dt>
      <dd>
        <CountdownView delta={Duration.fromMillis(0)} end={
          DateTime.fromISO(this.session.status.end_time)
        }/>
      </dd>
    </React.Fragment>;
    
    if(officialEndTime < DateTime.local()) {
      return (
        <p>{t("contest.ended at")} {officialEndTime.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}</p>
      );
    } else {

      return (
        <p>{t("contest.remaining time")} <CountdownView delta={Duration.fromMillis(0)} end={officialEndTime}/></p>
      );
    }
  }

  renderAllUsersCountdown() {
    const { t, i18n } = this.props;
    const users = this.session.users;
    const maxExtraTime = Math.max(users.data.items.map((user) => user.extra_time));
    const actualEndTime = DateTime.fromISO(this.session.status.end_time).plus({seconds: maxExtraTime});

    if(actualEndTime < DateTime.local()) {
      return (
        <p>{t("contest.ended for users at")} {actualEndTime.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}</p>
      );
    } else {
      return (
        <p>{t("contest.users remaining time")} <CountdownView delta={Duration.fromMillis(0)} end={actualEndTime}/></p>
      );
    }
  }

  renderCountdown() {
    const { t, i18n } = this.props;

    if (!this.session.status.start_time) return null;
    if (this.session.users.isLoading()) return <p>{t("loading")}</p>;

    const hasExtraTime = (this.countUsersWithExtraTime() > 0)

    return <React.Fragment>
      { hasExtraTime ? this.renderAllUsersCountdown() : null }
      <dt>{t("contest.remaining time")}</dt><dd>{ this.renderOfficialCountdown() }</dd>
    </React.Fragment>
  }

  renderLogSummary() {
    const { t, i18n } = this.props;

    if (this.logs.isLoading())
      return <React.Fragment>{t("loading")}</React.Fragment>;
    
    const items = this.logs.data.items;

    if (!items)
      return <React.Fragment>
        {t("contest.no error recorded")}
        {' '}
        (<Link to="/admin/logs">{t("contest.show log")}</Link>)
      </React.Fragment>;

    const lastError = DateTime.fromISO(items[0].date);

    return <React.Fragment>
      {t("contest.error recorded at")}
      {' '}
      <DateView date={lastError} />
      {' '}
      (<Link to="/admin/logs">{t("contest.show log")}</Link>)
    </React.Fragment>;
  }

  renderExtraTimeSummary() {
    const { t } = this.props;
    
    if(this.session.extraTimeMinutes() === 0) {
      return <dd>
        {t("contest.no extra time set")}
        {' '}
        (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)
      </dd>;
    } else {
      return <dd>
        {this.session.extraTimeMinutes() + " " + t('minutes')}
        {' '}
        (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)
      </dd>;
    }
  }

  countUsersWithExtraTime() {
    return this.session.users.data.items.filter((user) => user.extra_time !== 0).length;
  }

  renderUserExtraTimeSummary() {
    const { t } = this.props;
    const users = this.session.users;
    if(users.isLoading()) return <p>{t("loading")}</p>;

    const numExtraTimeUsers = this.countUsersWithExtraTime();
    if(numExtraTimeUsers > 0) {
      return (
        <p>{
          t("contest.users have extra time", {count: numExtraTimeUsers})
        } <Link to="/admin/users">{t("contest.manage users")}</Link></p>
      );
    } else {
      return (
        <p>{
          t("contest.no user has extra time")
        } <Link to="/admin/users">{t("contest.manage users")}</Link></p>
      );
    }
  }

  render() {
    const { t, i18n } = this.props;
    const status = this.session.status;

    return <React.Fragment>
      <h3 className="mt-4">{t("contest.title")}</h3>
      <dl>
        <dt>{t("contest status")}</dt>
        <dd>{ this.renderContestStatus() }</dd>
        <dt>{t("system status")}</dt>
        <dd>{ this.renderLogSummary() }</dd>
        <dt>{t("contest.extra time")}</dt>
        <dd>{ this.renderExtraTimeSummary() }</dd>
      { this.renderUserExtraTimeSummary() }
      </dl>
    </React.Fragment>
  }
}

export default translateComponent(AdminSummaryView, "admin");
