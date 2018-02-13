import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ModalView from '../ModalView';
import {translateComponent} from "../../utils";
import {Trans} from "react-i18next";
import Countdown from '../CountdownView';
import { DateTime } from 'luxon';
import client from '../../TerryClient';


class DownloadResultsView extends Component {
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

  componentWillMount() {
    this.loadPromise = client.adminApi(this.session.adminToken(), "/download_results")
      .then((response) => {
        this.data = response.data;
        delete this.loadPromise;
        this.forceUpdate();
      }, (response) => {
        delete this.loadPromise;
        this.forceUpdate();
        return Promise.reject(response);
      });
  }

  renderBody() {
    const { t } = this.props;

    if (this.loadPromise !== undefined)
      return <p>{t("loading")}</p>;

    return <a role="button" className="btn btn-primary" href={client.filesBaseURI + this.data.path} download>
      {t("contest.download results")}
    </a>;
  }

  render() {
    const { t } = this.props;

    return (
      <ModalView contentLabel={t("logs.title")} returnUrl={"/admin"}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t("contest.download results")}
          </h5>
          <Link to={"/admin"} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body">
          { this.renderBody() }
        </div>
        <div className="modal-footer">
          <Link to={"/admin"} role="button" className="btn btn-primary">
            <span aria-hidden="true" className="fa fa-times" /> {t("close")}
          </Link>
        </div>
      </ModalView>
    );
  }
}

export default translateComponent(DownloadResultsView, "admin");
