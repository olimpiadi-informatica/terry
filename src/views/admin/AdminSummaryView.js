import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import CountdownView from '../CountdownView';
import { DateTime, Duration } from 'luxon';

class AdminSummaryView extends Component {
  constructor(props) {
    super(props);
    this.session = props.session;
  }

  componentDidMount() {
    this.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.session.popObserver(this);
  }

  renderNotStarted() {
    const { t } = this.props;
    return <React.Fragment>
      <p>{t("contest.not started")}</p>
      <form ref="form" onSubmit={(e) => { e.preventDefault(); this.session.startContest(); }}>
        {this.renderError()}
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
    // TODO: show if there are errors
    return <p>{t("contest.no errors recorded")} (<Link to="/admin/logs">{t("contest.show log")}</Link>)</p>
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

  renderStarted() {
    const { t, i18n } = this.props;
    return <React.Fragment>
      <p>{t("contest.started at")} <em>{
        DateTime.fromISO(this.session.status.start_time).setLocale(i18n.language).toLocaleString()
      }</em>.</p>
      { this.renderCountdown() }
      { this.renderLogSummary() }
      { this.renderExtraTimeSummary() }
      { this.renderUserExtraTimeSummary() }
    </React.Fragment>
  }

  render() {
    const { t } = this.props;
    const status = this.session.status;

    let body = "";
    if (!status.start_time) body = this.renderNotStarted();
    else body = this.renderStarted();

    return <React.Fragment>
      <h1 className="mt-4">{t("contest.title")}</h1>
      {body}
    </React.Fragment>;
  }
}

export default translateComponent(AdminSummaryView, "admin");
