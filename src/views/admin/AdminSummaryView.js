import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import CountdownView from '../CountdownView';
import { DateTime, Duration } from 'luxon';
import Logs from '../../models/admin/Logs';

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
  }

  componentDidMount() {
    this.session.pushObserver(this);
    this.logs.pushObserver(this);
  }

  componentWillUnmount() {
    this.session.popObserver(this);
    this.logs.popObserver(this);
  }

  renderStartStatus() {
    if (!this.session.status.start_time) return this.renderStartButton();
    else return this.renderStarted();
  }

  renderStarted() {
    const { t, i18n } = this.props;
    return <p>{t("contest.started at")} <em>{
      DateTime.fromISO(this.session.status.start_time).setLocale(i18n.language).toLocaleString(
        DateTime.DATETIME_SHORT
      )
    }</em>.</p>;
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

  renderCountdown() {
    const { t } = this.props;
    if (!this.session.status.start_time) return null;
    // FIXME: delta=0 ????
    return <p>{t("contest.remaining time")} <CountdownView delta={Duration.fromMillis(0)} end={
      DateTime.fromISO(this.session.status.end_time)
    }/></p>
  }

  renderLogSummary() {
    const { t } = this.props;

    if(this.logs.isLoading()) return <p>{t("loading")}</p>
    if(!this.logs.data.items) return <p>
      {t("contest.no errors recorded")} (<Link to="/admin/logs">{t("contest.show log")}</Link>)
    </p>
    return <p><strong>{t("contest.errors recorded")}</strong> (<Link to="/admin/logs">{t("contest.show log")}</Link>)</p>;
  }

  renderExtraTimeSummary() {
    const { t } = this.props;
    if(this.session.extraTimeMinutes() === 0) {
      return (
        <p>{t("contest.no extra time set")} (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)</p>
      );
    } else {
      return (
        <p>{t("contest.extra time")} {this.session.extraTimeMinutes()} (<Link to="/admin/extra_time">{t("contest.set extra time")}</Link>)</p>
      );
    }
  }

  renderUserExtraTimeSummary() {
    const { t } = this.props;
    // TODO: show if some users have extra time set
    return <p><Link to="/admin/users">{t("contest.show user list")}</Link></p>;
  }

  render() {
    const { t, i18n } = this.props;
    const status = this.session.status;

    return <React.Fragment>
      <h1 className="mt-4">{t("contest.title")}</h1>
      { this.renderStartStatus() }
      { this.renderCountdown() }
      { this.renderLogSummary() }
      { this.renderExtraTimeSummary() }
      { this.renderUserExtraTimeSummary() }
    </React.Fragment>
  }
}

export default translateComponent(AdminSummaryView, "admin");
