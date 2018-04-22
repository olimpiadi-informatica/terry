import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faHourglassStart } from '@fortawesome/fontawesome-free-solid'
import ModalView from './ModalView';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify'
import { AdminSession } from './admin.models';
import { InjectedTranslateProps } from 'react-i18next';

type UserExtraTimeProps = {
  session: AdminSession
  user: any
} & InjectedTranslateProps

class UserExtraTimeView extends React.Component<UserExtraTimeProps> {
  setExtraTime() {
    const { t } = this.props

    if (!window.confirm(t("confirmation"))) return;

    const minutes = (this.refs.form as any).minutes.value
    this.props.session.setExtraTime(minutes * 60, this.props.user.token);

    // show success
    toast.success(t("user extra time done"))
  }

  extraTimeMinutes() {
    return Math.round(this.props.user.extra_time / 60)
  }

  render() {
    const { t } = this.props;

    return <form ref="form" className="form-inline" onSubmit={e => { e.preventDefault(); this.setExtraTime() }}>
      <input name="minutes" type="number" className="form-control mr-sm-2" defaultValue={'' + this.extraTimeMinutes()} />
      <button type="submit" className="btn btn-warning">
        <FontAwesomeIcon icon={faHourglassStart} /> {t("users.set")}
      </button>
    </form>;
  }
}

type AdminUsersProps = {
  session: AdminSession
  users: { data: { items: any[] } }
} & InjectedTranslateProps

export default class AdminUsersView extends React.Component<AdminUsersProps> {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  renderUser(user: any, i: number) {
    const ips = user.ip
      .map((ip: any, i: number) => <abbr key={i} title={new Date(ip.first_date).toLocaleString()}>{ip.ip}</abbr>)
      .map((item: any, i: number) => i === 0 ? [item] : [<span> - </span>, item]);
    return <tr key={i}>
      <td>{user.name}</td>
      <td>{user.surname}</td>
      <td>{user.token}</td>
      <td>{ips}</td>
      <td><UserExtraTimeView {...this.props} user={user} /></td>
    </tr>
  }

  render() {
    const { t } = this.props;

    return <ModalView contentLabel={t("users.title")} returnUrl={"/admin"}>
      <div className="modal-header">
        <h5 className="modal-title">
          {t("users.title")}
        </h5>
        <Link to={"/admin"} role="button" className="close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </Link>
      </div>
      <div className="modal-body no-padding">
        <table className="table terry-table">
          <thead>
            <tr>
              <th>{t("users.name")}</th>
              <th>{t("users.surname")}</th>
              <th>{t("users.token")}</th>
              <th>{t("users.ips")}</th>
              <th>{t("users.extra time")} <small>{t("users.in minutes")}</small></th>
            </tr>
          </thead>
          <tbody>
            {this.props.users.data.items.map((user, i) => this.renderUser(user, i))}
          </tbody>
        </table>
      </div>
      <div className="modal-footer">
        <Link to={"/admin"} role="button" className="btn btn-primary">
          <FontAwesomeIcon icon={faTimes} />  {t("close")}
        </Link>
      </div>
    </ModalView>;
  }
}
