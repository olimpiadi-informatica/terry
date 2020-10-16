import React from "react";
import { Link, useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import { Trans, t } from "@lingui/macro";
import { toast } from "react-toastify";
import { Modal } from "src/components/Modal";
import { i18n } from "src/i18n";
import { useStatus, useActions } from "./AdminContext";

export function ContestExtraTimeView() {
  const minutesRef = React.createRef<HTMLInputElement>();

  const history = useHistory();
  const status = useStatus();
  const { setExtraTime } = useActions();

  const doSetExtraTime = () => {
    if (!minutesRef.current) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(i18n._(t`Are you sure?`))) return;

    const minutes = parseInt(minutesRef.current.value, 10);
    setExtraTime(minutes * 60).then(() => {
      toast.success(i18n._(t`Extra time successfully updated`));
      history.push("/admin");
    });
  };

  return (
    <Modal contentLabel={i18n._(t`Extra time`)} returnUrl="/admin">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSetExtraTime();
        }}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <Trans>Extra time</Trans>
          </h5>
          <Link to="/admin" role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body">
          <p>
            <Trans>
              You can set an extra time for all the contestants in case of problems that afflicts everyone. This action
              {" "}
              <em>is logged</em>
              {" "}
              and must be justified to the committee.
            </Trans>
          </p>
          <div className="form-group mb-0">
            <label htmlFor="minutes">
              <Trans>Extra time</Trans>
              :
            </label>
            <input
              id="minutes"
              name="minutes"
              type="number"
              ref={minutesRef}
              className="form-control"
              required
              defaultValue={`${Math.round((status.value().extra_time || 0) / 60)}`}
            />
            <small className="form-text text-muted">
              <Trans>(in minutes)</Trans>
            </small>
          </div>
        </div>
        <div className="modal-footer">
          <Link to="/admin" role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes} />
            {" "}
            <Trans>Close</Trans>
          </Link>
          <button type="submit" className="btn btn-warning">
            <FontAwesomeIcon icon={faHourglassStart} />
            {" "}
            <Trans>Set extra time</Trans>
          </button>
        </div>
      </form>
    </Modal>
  );
}
