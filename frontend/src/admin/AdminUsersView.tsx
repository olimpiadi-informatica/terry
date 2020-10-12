import React, { createRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Trans, t } from "@lingui/macro";
import { Modal } from "src/components/Modal";
import { i18n } from "src/i18n";
import { Loading } from "src/components/Loading";
import { UserEntry } from "src/types/admin";
import { useActions } from "./AdminContext";
import { useUsers } from "./hooks/useUsers";

type UserExtraTimeProps = {
  user: UserEntry;
};

function UserExtraTimeView({ user }: UserExtraTimeProps) {
  const minutesRef = createRef<HTMLInputElement>();
  const { setExtraTime } = useActions();

  const doSetExtraTime = () => {
    if (!minutesRef.current) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(i18n._(t`Are you sure?`))) return;

    const minutes = parseInt(minutesRef.current.value, 10);
    setExtraTime(minutes * 60, user.token);
    toast.success(i18n._(t`Extra time successfully updated for the user`));
  };

  const extraTimeMinutes = () => Math.round(user.extra_time / 60);

  return (
    <form
      className="form-inline"
      onSubmit={(e) => {
        e.preventDefault();
        doSetExtraTime();
      }}
    >
      <input
        name="minutes"
        type="number"
        ref={minutesRef}
        className="form-control mr-sm-2"
        defaultValue={`${extraTimeMinutes()}`}
      />
      <button type="submit" className="btn btn-warning">
        <FontAwesomeIcon icon={faHourglassStart} />
        {" "}
        <Trans>Set</Trans>
      </button>
    </form>
  );
}

export function AdminUsersView() {
  const [users] = useUsers();
  if (users.isLoading()) return <Loading />;
  if (users.isError()) return <Trans>Error</Trans>;

  const renderUserRow = (user: UserEntry, i: number) => {
    const ips = user.ip
      .map((ip) => (
        <abbr key={ip.ip} title={new Date(ip.first_date).toLocaleString()}>
          {ip.ip}
        </abbr>
      ))
      // join with a separator
      .map((item, j) => (j === 0 ? [item] : [<span key={`span-${item.key}`}> - </span>, item]));
    return (
      <tr key={i}>
        <td>{user.name}</td>
        <td>{user.surname}</td>
        <td>{user.token}</td>
        <td>{ips}</td>
        <td>
          <UserExtraTimeView user={user} />
        </td>
      </tr>
    );
  };

  return (
    <Modal contentLabel={i18n._(t`Contestants`)} returnUrl="/admin">
      <div className="modal-header">
        <h5 className="modal-title">{i18n._(t`Contestants`)}</h5>
        <Link to="/admin" role="button" className="close" aria-label="Close">
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
                <Trans>Extra time</Trans>
                {" "}
                <small>
                  <Trans>(in minutes)</Trans>
                </small>
              </th>
            </tr>
          </thead>
          <tbody>{users.value().items.map((user, i) => renderUserRow(user, i))}</tbody>
        </table>
      </div>
      <div className="modal-footer">
        <Link to="/admin" role="button" className="btn btn-primary">
          <FontAwesomeIcon icon={faTimes} />
          {" "}
          <Trans>Close</Trans>
        </Link>
      </div>
    </Modal>
  );
}
