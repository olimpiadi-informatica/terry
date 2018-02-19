import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import faHourglassStart from '@fortawesome/fontawesome-free-solid/faHourglassStart'
import {translateComponent} from "./utils";
import LoadingView from "./LoadingView";
import ModalView from './ModalView';
import { Link } from 'react-router-dom';

class UserExtraTimeView extends Component {
  setExtraTime() {
    if (!window.confirm('Are you sure?')) return;

    const minutes = this.refs.form.minutes.value
    this.props.session.setExtraTime(minutes * 60, this.props.user.token);
  }

  extraTimeMinutes() {
    return Math.round(this.props.user.extra_time / 60)
  }

  render() {
    const { t } = this.props;

    return <form ref="form" className="form-inline" onSubmit={e => { e.preventDefault(); this.setExtraTime() } }>
      <input name="minutes" type="number" className="form-control mr-sm-2" defaultValue={this.extraTimeMinutes()} />
      <button type="submit" className="btn btn-warning">
        <FontAwesomeIcon icon={faHourglassStart}/> {t("users.set")}
      </button>
    </form>;
  }
}

UserExtraTimeView = translateComponent(UserExtraTimeView, "admin");

class AdminUsersView extends Component {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  renderUser(user, i) {
    const ips = user.ip
        .map((ip,i) => <abbr key={i} title={new Date(ip.first_date).toLocaleString()}>{ip.ip}</abbr>)
        .map((item,i) => i === 0 ? [item] : [<span> - </span>, item]);
    return <tr key={i}>
      <td>{user.name}</td>
      <td>{user.surname}</td>
      <td>{user.token}</td>
      <td>{ips}</td>
      <td><UserExtraTimeView {...this.props} user={user}/></td>
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
            { this.props.users.data.items.map((user, i) => this.renderUser(user, i))}
          </tbody>
        </table>
      </div>
      <div className="modal-footer">
        <Link to={"/admin"} role="button" className="btn btn-primary">
          <FontAwesomeIcon icon={faTimes}/>  {t("close")}
        </Link>
      </div>
    </ModalView>;
  }
}

export default translateComponent(AdminUsersView, "admin");
