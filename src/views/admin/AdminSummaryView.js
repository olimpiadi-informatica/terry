import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import Countdown from '../CountdownView';
import { DateTime } from 'luxon';

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
      <p>{t("contest.extra time")} {this.session.extraTimeMinutes()}<Link to="/admin/extra_time">{t("contest.set extra time")}</Link></p>
      <p><Link to="/admin/users">Visualizza la lista utenti</Link></p>
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
