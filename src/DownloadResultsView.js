import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTrophy from '@fortawesome/fontawesome-free-solid/faTrophy'
import ModalView from './ModalView';
import { translateComponent } from "./utils";
import client from './TerryClient';

class DownloadResultsView extends Component {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  componentWillMount() {
    this.loadPromise = client.adminApi(this.props.session.adminToken(), "/download_results")
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

  renderDownloadButton() {
    const { t } = this.props;

    if (this.loadPromise !== undefined)
      return <h3>{t("generating zip")}</h3>;

    return <a role="button" className="btn btn-success btn-lg" href={client.filesBaseURI + this.data.path} download>
      <FontAwesomeIcon icon={faTrophy} />
      {' '}
      {t("contest.download results")}
      {' '}
      <FontAwesomeIcon icon={faTrophy} />
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
          <div className="mb-3">
            {t("contest.download results description")}
          </div>
          {this.renderDownloadButton()}
        </div>
      </ModalView>
    );
  }
}

export default translateComponent(DownloadResultsView, "admin");
