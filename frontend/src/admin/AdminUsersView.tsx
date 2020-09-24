import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import ModalView from "../ModalView";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminSession } from "./admin.models";
import { Trans, t } from "@lingui/macro";
import { i18n } from "../i18n";

type UserExtraTimeProps = {
  session: AdminSession;
  user: any;
};

class UserExtraTimeView extends React.Component<UserExtraTimeProps> {
  minutesRef: React.RefObject<HTMLInputElement>;

  constructor(props: UserExtraTimeProps) {
    super(props);
    this.minutesRef = React.createRef();
  }

  setExtraTime() {
    if (!window.confirm(i18n._(t`Are you sure?`))) return;

    const minutes = parseInt(this.minutesRef.current!.value);
    this.props.session.setExtraTime(minutes * 60, this.props.user.token);

    // show success
    toast.success(i18n._(t`Extra time successfully updated for the user`));
  }

  extraTimeMinutes() {
    return Math.round(this.props.user.extra_time / 60);
  }

  render() {
    return (
      <form
        className="form-inline"
        onSubmit={(e) => {
          e.preventDefault();
          this.setExtraTime();
        }}
      >
        <input
          name="minutes"
          type="number"
          ref={this.minutesRef}
          className="form-control mr-sm-2"
          defaultValue={"" + this.extraTimeMinutes()}
        />
        <button type="submit" className="btn btn-warning">
          <FontAwesomeIcon icon={faHourglassStart} /> <Trans>Set</Trans>
        </button>
      </form>
    );
  }
}

type AdminUsersProps = {
  session: AdminSession;
  users: { data: { items: any[] } };
};

export default class AdminUsersView extends React.Component<AdminUsersProps> {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  renderUser(user: any, i: number) {
    const ips = user.ip
      .map((ip: any, i: number) => (
        <abbr key={i} title={new Date(ip.first_date).toLocaleString()}>
          {ip.ip}
        </abbr>
      ))
      .map((item: any, i: number) => (i === 0 ? [item] : [<span> - </span>, item]));
    return (
      <tr key={i}>
        <td>{user.name}</td>
        <td>{user.surname}</td>
        <td>{user.token}</td>
        <td>{ips}</td>
        <td>
          <UserExtraTimeView session={this.props.session} user={user} />
        </td>
      </tr>
    );
  }

  render() {
    return (
      <ModalView contentLabel={i18n._(t`Contestants`)} returnUrl={"/admin"}>
        <div className="modal-header">
          <h5 className="modal-title">{i18n._(t`Contestants`)}</h5>
          <Link to={"/admin"} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body no-padding">
          <table className="table terry-table">
            <thead>
              <tr>
                <th>
                  <Trans>Name</Trans>
                </th>
                <th>
                  <Trans>Surname</Trans>
                </th>
                <th>
                  <Trans>Token</Trans>
                </th>
                <th>
                  <Trans>IP</Trans>
                </th>
                <th>
                  <Trans>Extra time</Trans>{" "}
                  <small>
                    <Trans>(in minutes)</Trans>
                  </small>
                </th>
              </tr>
            </thead>
            <tbody>{this.props.users.data.items.map((user, i) => this.renderUser(user, i))}</tbody>
          </table>
        </div>
        <div className="modal-footer">
          <Link to={"/admin"} role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes} /> <Trans>Close</Trans>
          </Link>
        </div>
      </ModalView>
    );
  }
}
