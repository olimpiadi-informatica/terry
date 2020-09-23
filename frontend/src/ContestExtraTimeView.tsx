import * as React from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import ModalView from "./ModalView";
import { Trans, t } from "@lingui/macro";
import { i18n } from "./i18n";
import { toast } from "react-toastify";
import { AdminSession } from "./admin.models";

type Props = {
  session: AdminSession;
  status: {
    data: { start_time: string; end_time: string };
    extraTimeMinutes: () => number;
  };
} & RouteComponentProps<any>;

class ContestExtraTimeView extends React.Component<Props> {
  minutesRef: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);
    this.minutesRef = React.createRef();
  }

  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  setExtraTime() {
    if (!window.confirm(i18n._(t`Are you sure?`))) return;

    const minutes = parseInt(this.minutesRef.current!.value);

    this.props.session.setExtraTime(minutes * 60).then(() => {
      // notify success
      toast.success(i18n._(t`Extra time successfully updated`));

      // redirect
      this.props.history.push("/admin");
    });
  }

  render() {
    return (
      <ModalView contentLabel={i18n._(t`Extra time`)} returnUrl={"/admin"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            this.setExtraTime();
          }}
        >
          <div className="modal-header">
            <h5 className="modal-title">
              <Trans>Extra time</Trans>
            </h5>
            <Link to={"/admin"} role="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </Link>
          </div>
          <div className="modal-body">
            <p>
              <Trans>
                You can set an extra time for all the contestants in case of problems that afflicts everyone. This
                action <em>is logged</em> and must be justified to the committee.
              </Trans>
            </p>
            <div className="form-group mb-0">
              <label htmlFor="minutes">
                <Trans>Extra time</Trans>:
              </label>
              <input
                id="minutes"
                name="minutes"
                type="number"
                ref={this.minutesRef}
                className="form-control"
                required
                defaultValue={"" + this.props.status.extraTimeMinutes()}
              />
              <small className="form-text text-muted">
                <Trans>(in minutes)</Trans>
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <Link to={"/admin"} role="button" className="btn btn-primary">
              <FontAwesomeIcon icon={faTimes} /> <Trans>Close</Trans>
            </Link>
            <button type="submit" className="btn btn-warning">
              <FontAwesomeIcon icon={faHourglassStart} /> <Trans>Set extra time</Trans>
            </button>
          </div>
        </form>
      </ModalView>
    );
  }
}

export default withRouter(ContestExtraTimeView);
