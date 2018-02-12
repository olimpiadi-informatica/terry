import React, { Component } from 'react';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import Countdown from '../CountdownView';
import { DateTime } from 'luxon';

class ContestView extends Component {
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

  setExtraTime() {
    if (!window.confirm('Are you sure?')) return;

    const minutes = this.refs.extraTimeForm.minutes.value
    this.session.setExtraTime(minutes * 60);
    this.forceUpdate();
  }

  extraTimeMinutes() {
    return Math.round(this.session.status.extra_time / 60)
  }

  renderStarted() {
    const { t } = this.props;
    // FIXME: delta=0 ????
    const countdown = this.session.status.start_time ? <Countdown delta={0} end={
      DateTime.fromISO(this.session.status.end_time)
    }/> : "";
    return <React.Fragment>
      <p>{t("contest.started at")} <em>{
        new Date(this.session.status.start_time).toLocaleString()
      }</em>.</p>
      <p>{t("contest.remaining time")} {countdown}</p>
      <Trans i18nKey="contest.extratime disclamer" parent="p">
        You can set an extra time for all the contestants in case of problems that afflicts everyone. This action <em>is logged</em> and must be justified to the committee.
      </Trans>

      <form ref="extraTimeForm" onSubmit={(e) => { e.preventDefault(); this.setExtraTime() }}>
        {this.renderError()}
        <div className="form-group">
          <label htmlFor="minutes">{t("contest.extra time")}</label>
          <input
            id="minutes"
            name="minutes"
            type="number"
            className="form-control"
            required
            defaultValue={this.extraTimeMinutes()}
          />
        <small className="form-text text-muted">{t("contest.in minutes")}</small>
        </div>
        <button type="submit" className="btn btn-warning">
          <span className="fa fa-clock-o" aria-hidden="true" /> {t("contest.set extra time")}
        </button>
      </form>
    </React.Fragment>
  }

  renderError() {
    const { t } = this.props;
    if (!this.session.error) return "";
    const message = this.session.error;

    return <div className="alert alert-danger" role="alert">
      <strong>{t("error")}</strong> {message}
    </div>
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

export default translateComponent(ContestView, "admin");
