import React, { Component } from 'react';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";

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

  extractContest() {
    const form = this.refs.form;
    const filename = form[0].value;
    const password = form[1].value;
    this.session.extractContest(filename, password);
  }

  renderNotLoaded() {
    const { t } = this.props;
    return <div>
      <p>{t("contest.need to extract.part1")}</p>
      <p>{t("contest.need to extract.part2")}</p>
      <form ref="form" className="col-md-6" onSubmit={(e) => { e.preventDefault(); this.extractContest(); }}>
        {this.renderError()}
        <div className="form-group">
          <label htmlFor="filename">{t("contest.archive")}</label>
          <input className="form-control" id="filename" placeholder={t("contest.enter zip")} required />
          <small className="form-text text-muted">{t("contest.include extension")}</small>
        </div>
        <div className="form-group">
          <label htmlFor="password">{t("contest.password")}</label>
          <input type="password" className="form-control" id="password" placeholder={t("contest.password")} />
        </div>
        <button type="submit" className="btn btn-primary">
          <span className="fa fa-file-archive-o" aria-hidden="true" /> {t("contest.extract")}
        </button>
      </form>
    </div>;
  }

  renderNotStarted() {
    const { t } = this.props;
    return <div>
      <p>{t("contest.not started")}</p>
      <form ref="form" className="col-md-6" onSubmit={(e) => { e.preventDefault(); this.session.startContest(); }}>
        {this.renderError()}
        <button type="submit" className="btn btn-primary">
          <span className="fa fa-play" aria-hidden="true" /> {t("contest.start")}
        </button>
      </form>
    </div>;
  }

  renderStarted() {
    const { t } = this.props;
    return <div>
      <p>{t("contest.started at")} <em>{new Date(this.session.status.start_time).toLocaleString()}</em>.</p>
      <Trans i18nKey="contest.extratime disclamer" parent="p">
        You can set an extra time for all the contestants in case of problems that afflicts everyone. This action <em>is logged</em> and must be justified to the committee.
      </Trans>

      <form ref="form" className="col-md-6" onSubmit={(e) => { e.preventDefault(); this.session.setExtraTime(this.session.status.extra_time); }}>
        {this.renderError()}
        <div className="form-group">
          <label htmlFor="extraTime">{t("contest.extra time")}</label>
          <input type="number" className="form-control" id="extraTime" placeholder={t("contest.extra time")} required
                 value={this.session.status.extra_time} onChange={(e) => {
            this.session.status.extra_time = e.target.value;
            this.forceUpdate();
          }}/>
          <small className="form-text text-muted">{t("contest.in seconds")}</small>
        </div>
        <button type="submit" className="btn btn-warning">
          <span className="fa fa-clock-o" aria-hidden="true" /> {t("contest.set extra time")}
        </button>
      </form>
    </div>
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
    if (!status.loaded) body = this.renderNotLoaded();
    else if (!status.start_time) body = this.renderNotStarted();
    else body = this.renderStarted();

    return <div>
      <h1 className="mt-4">{t("contest.title")}</h1>
      {body}
    </div>;
  }
}

export default translateComponent(ContestView, "admin");