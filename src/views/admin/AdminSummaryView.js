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
    const { t, i18n } = this.props;

    if(this.session.users.isLoading()) return <p>{t("loading")}</p>;

    if(!this.session.status.start_time) return this.renderNotStarted();
    if(DateTime.local() < this.getEndTime()) return this.renderRunning();
    if(DateTime.local() < this.getExtraTimeEndTime()) return this.renderRunningExtraTime();
    return this.renderFinished();
  }

  renderNotStarted() {
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
    return this.session.users.data.items.filter((user) => user.extra_time !== 0).length;
  }

  getStartTime() {
    return DateTime.fromISO(this.session.status.start_time);
  }

  getEndTime() {
    return DateTime.fromISO(this.session.status.end_time);
  }

  getUsersExtraTime() {
    return Math.max(this.session.users.data.items.map((user) => user.extra_time))
  }

  getExtraTimeEndTime() {
    return this.getEndTime().plus({seconds: this.getUsersExtraTime()});
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
    const extra = Duration.fromObject({
      seconds: this.getUsersExtraTime()
    });
    return <span>({t("minutes more for some users", {count: extra.as('minutes')})})</span>;
  }

  renderCountdown() {
    const { t, i18n } = this.props;
    return <React.Fragment>
      {t("contest.remaining time")} <CountdownView delta={Duration.fromMillis(0)} end={this.getEndTime()}/>
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
    const users = this.session.users;
    const endTime = this.getExtraTimeEndTime();

    return (
      <React.Fragment>
        {t("contest.users remaining time")}
        {' '}
        <CountdownView delta={Duration.fromMillis(0)} end={endTime}/>
      </React.Fragment>
    );
  }

  renderLogSummary() {
    const { t, i18n } = this.props;

    if (this.logs.isLoading())
      return <React.Fragment>{t("loading")}</React.Fragment>;

    const items = this.logs.data.items;

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
      <DateView date={lastError} />
      {' '}
      (<Link to="/admin/logs">{t("contest.show log")}</Link>)
    </React.Fragment>;
  }

  renderExtraTimeSummary() {
    const { t } = this.props;

    if(this.session.extraTimeMinutes() === 0) {
      return <React.Fragment>
        {t("contest.no extra time set")}
        {' '}
        (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)
      </React.Fragment>;
    } else {
      return <React.Fragment>
        {t('minutes', {count: this.session.extraTimeMinutes()})}
        {' '}
        (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)
      </React.Fragment>;
    }
  }

  renderUserExtraTimeSummary() {
    const { t } = this.props;
    const users = this.session.users;
    if(users.isLoading()) return <React.Fragment>{t("loading")}</React.Fragment>;

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
    const status = this.session.status;

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
          <ul class="mb-0">
            <li>{ this.renderLogSummary() }</li>
          </ul>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h3>{t("contest.extra time management")}</h3>
          <ul class="mb-0">
            <li>{ this.renderExtraTimeSummary() }</li>
            <li>{ this.renderUserExtraTimeSummary() }</li>
          </ul>
        </div>
      </div>
    </div>
  }
}

export default translateComponent(AdminSummaryView, "admin");
