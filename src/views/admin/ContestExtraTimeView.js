import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ModalView from '../ModalView';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import Countdown from '../CountdownView';
import { DateTime } from 'luxon';

class ContestExtraTimeView extends Component {
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

  setExtraTime() {
    if (!window.confirm('Are you sure?')) return;

    const minutes = this.refs.extraTimeForm.minutes.value

    this.session.setExtraTime(minutes * 60).then(() => {
      // FIXME: i18n? :)
      window.alert("Extra time updated.");
    })
    this.forceUpdate();
  }

  extraTimeMinutes() {
    return Math.round(this.session.status.extra_time / 60)
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
    return (
      <ModalView contentLabel={t("logs.title")} returnUrl={"/admin"}>
        <form ref="extraTimeForm" onSubmit={(e) => { e.preventDefault(); this.setExtraTime() }}>
          <div className="modal-header">
            <h5 className="modal-title">
              {t("contest.extra time")}
            </h5>
            <Link to={"/admin"} role="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </Link>
          </div>
          <div className="modal-body">
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
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-warning">
              <span className="fa fa-clock-o" aria-hidden="true" /> {t("contest.set extra time")}
            </button>
          </div>
        </form>
      </ModalView>
    );
  }
}

export default translateComponent(ContestExtraTimeView, "admin");
