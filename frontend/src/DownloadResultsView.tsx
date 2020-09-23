import * as React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import ModalView from "./ModalView";
import client from "./TerryClient";
import { AdminSession } from "./admin.models";
import { Trans, t } from "@lingui/macro";
import { i18n } from "./i18n";

type Props = {
  session: AdminSession;
};

export default class DownloadResultsView extends React.Component<Props> {
  data: any;
  loadPromise?: Promise<void>;

  componentDidMount() {
    this.loadPromise = client.adminApi(this.props.session.adminToken(), "/download_results").then(
      (response) => {
        this.data = response.data;
        delete this.loadPromise;
        this.forceUpdate();
      },
      (response) => {
        delete this.loadPromise;
        this.forceUpdate();
        return Promise.reject(response);
      }
    );
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  renderDownloadButton() {
    if (this.data === undefined)
      return (
        <h3>
          <Trans>Creating final zip...</Trans>
        </h3>
      );

    return (
      <a role="button" className="btn btn-success btn-lg" href={client.filesBaseURI + this.data.path} download>
        <FontAwesomeIcon icon={faTrophy} /> <Trans>Download contest results</Trans> <FontAwesomeIcon icon={faTrophy} />
      </a>
    );
  }

  render() {
    return (
      <ModalView contentLabel={i18n._(t`Download results`)} returnUrl={"/admin"}>
        <div className="modal-header">
          <h5 className="modal-title">
            <Trans>Download contest results</Trans>
          </h5>
          <Link to={"/admin"} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <Trans>
              The contest is finished, you must now download the zip containing all the contest data. This zip must then
              be sent to the committee.
            </Trans>
          </div>
          {this.renderDownloadButton()}
        </div>
      </ModalView>
    );
  }
}
