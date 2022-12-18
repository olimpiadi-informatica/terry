import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Trans, t } from "@lingui/macro";
import { Modal } from "src/components/Modal";
import { client } from "src/TerryClient";
import { notifyError } from "src/utils";
import { Loadable } from "src/Loadable";
import { ZipData } from "src/types/admin";
import { Error } from "src/components/Error";
import { useToken } from "./AdminContext";

export function DownloadResultsView() {
  const token = useToken();
  const [zip, setZip] = useState<Loadable<ZipData>>(Loadable.loading());

  if (!token) throw new window.Error("DownloadResultView needs to be logged in");

  useEffect(() => {
    client.adminApi(token, "/download_results").then(
      (response) => {
        setZip(Loadable.of(response.data as ZipData));
      },
      (response) => {
        notifyError(response);
        setZip(Loadable.error(response));
      },
    );
  }, [token]);

  const renderDownloadButton = () => {
    if (zip.isLoading()) {
      return (
        <h3>
          <Trans>Creating final zip...</Trans>
        </h3>
      );
    }
    if (zip.isError()) return <Error cause={zip.error()} />;

    return (
      <a role="button" className="btn btn-success btn-lg" href={client.filesBaseURI + zip.value().path} download>
        <FontAwesomeIcon icon={faTrophy} />
        {" "}
        <Trans>Download contest results</Trans>
        {" "}
        <FontAwesomeIcon icon={faTrophy} />
      </a>
    );
  };

  return (
    <Modal contentLabel={t`Download results`} returnUrl="/admin">
      <div className="modal-header">
        <h5 className="modal-title">
          <Trans>Download contest results</Trans>
        </h5>
        <Link to="/admin" role="button" className="close" aria-label="Close">
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
        {renderDownloadButton()}
      </div>
    </Modal>
  );
}
