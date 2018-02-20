import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import faHourglassStart from '@fortawesome/fontawesome-free-solid/faHourglassStart'
import ModalView from './ModalView';
import {translateComponent} from "./utils";
import {Trans} from "react-i18next";

class ContestExtraTimeView extends Component {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  setExtraTime() {
    if (!window.confirm('Are you sure?')) return;

    const minutes = this.refs.extraTimeForm.minutes.value

    this.props.session.setExtraTime(minutes * 60);
  }

  renderError() {
    const { t } = this.props;
    if (!this.props.session.error) return "";
    const message = this.props.session.error;

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
            <Trans i18nKey="contest.extratime disclamer" parent="p">
              You can set an extra time for all the contestants in case of problems that afflicts everyone. This action <em>is logged</em> and must be justified to the committee.
            </Trans>
            <div className="form-group mb-0">
              <label htmlFor="minutes">{t("contest.extra time")}:</label>
              <input
                id="minutes"
                name="minutes"
                type="number"
                className="form-control"
                required
                defaultValue={this.props.status.extraTimeMinutes()}
              />
              <small className="form-text text-muted">{t("contest.in minutes")}</small>
            </div>
          </div>
          <div className="modal-footer">
            <Link to={"/admin"} role="button" className="btn btn-primary">
              <FontAwesomeIcon icon={faTimes}/> {t("close")}
            </Link>
            <button type="submit" className="btn btn-warning">
              <FontAwesomeIcon icon={faHourglassStart}/> {t("contest.Set extra time")}
            </button>
          </div>
        </form>
      </ModalView>
    );
  }
}

export default translateComponent(ContestExtraTimeView, "admin");
