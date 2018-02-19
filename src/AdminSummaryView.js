import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faPlay from '@fortawesome/fontawesome-free-solid/faPlay'
import {translateComponent} from "./utils";
import {Trans} from "react-i18next";
import { CountdownView } from './datetime.views';
import { DateTime, Duration } from 'luxon';
import { DateView } from './datetime.views';
import client from './TerryClient';
import PromiseView from './PromiseView';

class AdminSummaryView extends Component {
  componentWillMount() {
    this.logsPromise = this.props.session.loadLogs({
      start_date: "2000-01-01T00:00:00.000",
      end_date: "2030-01-01T00:00:00.000",
      level: "WARNING",
    });
  }

  componentDidMount() {
    this.props.session.pushObserver(this);

    const tickrate = 1000;
    this.timer = setInterval(() => this.forceUpdate(), tickrate);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }

    this.props.session.popObserver(this);
  }

  serverTime() {
    return DateTime.local().minus(this.props.session.timeDelta);
  }

  renderContestStatus() {
    const { t, i18n } = this.props;

    if(!this.props.status.data.start_time) return this.renderNotStarted();
    if(this.serverTime() < this.getEndTime()) return this.renderRunning();
    if(this.serverTime() < this.getExtraTimeEndTime()) return this.renderRunningExtraTime();
    return this.renderFinished();
  }

  renderNotStarted() {
    const { t } = this.props;
    return <React.Fragment>
      <p>{t("contest.not started")}</p>
      <form ref="form" onSubmit={(e) => { e.preventDefault(); this.props.session.startContest(); }}>
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faPlay}/> {t("contest.start")}
        </button>
      </form>
    </React.Fragment>;
  }

  renderRunning() {
    return <ul className="mb-0">
      <li>{ this.renderStartTime() }</li>
      <li>{ this.renderCountdown() }</li>
    </ul>;
  }

  renderRunningExtraTime() {
    return <ul className="mb-0">
      <li>{ this.renderStartTime() }</li>
      <li>{ this.renderEndTime() }</li>
      <li>{ this.renderExtraTimeCountdown() }</li>
    </ul>;
  }

  renderFinished() {
    const { t } = this.props;

    return <React.Fragment>
      <ul>
        <li>{ this.renderStartTime() }</li>
        <li>{ this.renderEndTime() }</li>
        { this.renderExtraTimeEndTime() }
      </ul>

      <Link to={'/admin/download_results'} className="btn btn-primary">
        {t("contest.download")}
      </Link>
    </React.Fragment>;
  }

  countUsersWithExtraTime() {
    return this.props.users.data.items.filter((user) => user.extra_time !== 0).length;
  }

  getStartTime() {
    return DateTime.fromISO(this.props.status.data.start_time);
  }

  getEndTime() {
    return DateTime.fromISO(this.props.status.data.end_time);
  }

  getUsersExtraTime() {
    return Math.max.apply(null, this.props.users.data.items.map((user) => user.extra_time))
  }

  getExtraTimeEndTime() {
    return this.getEndTime().plus({seconds: this.getUsersExtraTime()});
  }

  isDeletable() {
    return true;

    // ... this.props.status.data.deletable
  }

  renderStartTime() {
    const { t, i18n } = this.props;
    const startTime = this.getStartTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT);
    return <React.Fragment>
      {t("contest.started at")} {startTime}
    </React.Fragment>
  }

  renderCountdownExtra() {
    if(this.countUsersWithExtraTime() === 0) return;

    const { t, i18n } = this.props;
    return <span>({t("minutes more for some users", {count: this.getUsersExtraTime() / 60})})</span>;
  }

  renderCountdown() {
    const { t, i18n } = this.props;
    return <React.Fragment>
      {t("contest.remaining time")} <CountdownView {...this.props} delta={this.props.session.timeDelta} end={this.getEndTime()}/>
      { this.renderCountdownExtra() }
    </React.Fragment>;
  }

  renderEndTime() {
    const { t, i18n } = this.props;
    return <React.Fragment>
      {t("contest.ended at")}
      {' '}
      {this.getEndTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
    </React.Fragment>;
  }

  renderExtraTimeEndTime() {
    if(this.countUsersWithExtraTime() === 0) return null;

    const { t, i18n } = this.props;
    return <li>
      {t("contest.ended for everyone at")}
      {' '}
      {this.getExtraTimeEndTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
    </li>;
  }

  renderExtraTimeCountdown() {
    const { t, i18n } = this.props;
    const users = this.props.users;
    const endTime = this.getExtraTimeEndTime();

    return (
      <React.Fragment>
        {t("contest.users remaining time")}
        {' '}
        <CountdownView {...this.props} delta={this.props.session.timeDelta} end={endTime}/>
      </React.Fragment>
    );
  }

  renderLogSummary(logs) {
    const { t, i18n } = this.props;

    const items = logs.items;

    if (items.length === 0)
      return <React.Fragment>
        {t("contest.no error recorded")}
        {' '}
        (<Link to="/admin/logs">{t("contest.show log")}</Link>)
      </React.Fragment>;

    const lastError = DateTime.fromISO(items[0].date);

    return <React.Fragment>
      {t("contest.error recorded at")}
      {' '}
      <DateView {...this.props} delta={this.props.session.timeDelta} date={lastError} />
      {' '}
      (<Link to="/admin/logs">{t("contest.show log")}</Link>)
    </React.Fragment>;
  }

  renderExtraTimeSummary() {
    const { t } = this.props;

    if(this.props.status.extraTimeMinutes() === 0) {
      return <React.Fragment>
        {t("contest.no extra time set")}
        {' '}
        (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)
      </React.Fragment>;
    } else {
      return <React.Fragment>
        {t('minutes', {count: this.props.status.extraTimeMinutes()})}
        {' '}
        (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)
      </React.Fragment>;
    }
  }

  renderUserExtraTimeSummary() {
    const { t } = this.props;
    const users = this.props.users;

    const numExtraTimeUsers = this.countUsersWithExtraTime();
    if(numExtraTimeUsers > 0) {
      return <React.Fragment>
        {t("contest.users have extra time", {count: numExtraTimeUsers})}
        {' '}
        (<Link to="/admin/users">{t("contest.manage users")}</Link>)
      </React.Fragment>;
    } else {
      return <React.Fragment>
        {t("contest.no user has extra time")}
        {' '}
        (<Link to="/admin/users">{t("contest.manage users")}</Link>)
      </React.Fragment>;
    }
  }

  render() {
    const { t, i18n } = this.props;
    const status = this.props.status.data;

    return <div className="container">
      <div className="card mb-3">
        <div className="card-body">
          <h3>{t("contest status")}</h3>
          { this.renderContestStatus() }
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h3>{t("system status")}</h3>
          <ul className="mb-0">
            <li><PromiseView promise={this.logsPromise} renderFulfilled={(logs) => this.renderLogSummary(logs)}/></li>
          </ul>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h3>{t("contest.extra time management")}</h3>
          <ul className="mb-0">
            <li>{ this.renderExtraTimeSummary() }</li>
            <li>{ this.renderUserExtraTimeSummary() }</li>
          </ul>
        </div>
      </div>
      <div className="card mb-3 striped-background">
        <div className="card-body">
          <h3>Danger zone</h3>
          <button disabled={!this.isDeletable()} className="btn btn-danger" onClick={() => this.resetContest()}>RESET</button>
        </div>
      </div>
    </div>
  }

  resetContest() {
    if (!window.confirm("Are you sure?")) return;

    const { t } = this.props;
    client.adminApi(this.props.session.adminToken(), "/drop_contest", {});
    window.alert(t("reload"));
  }
}

export default translateComponent(AdminSummaryView, "admin");
