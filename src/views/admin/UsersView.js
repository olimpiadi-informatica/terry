import React, { Component } from 'react';
import {translateComponent} from "../../utils";
import Users from "../../models/admin/Users";
import LoadingView from "../LoadingView";

class UsersView extends Component {
  constructor(props) {
    super(props);
    this.session = props.session;
    this.users = new Users(this.session);
  }

  componentWillMount() {
    this.users.load();
  }

  componentDidMount() {
    this.users.pushObserver(this);
  }

  componentWillUnmount() {
    this.users.popObserver(this);
  }

  setExtraTime(user) {
    this.session.setExtraTime(user.extra_time, user.token);
  }

  renderExtraTime(user) {
    const { t } = this.props;

    return <form className="form-inline" onSubmit={e => { e.preventDefault(); this.setExtraTime(user) } }>
      <input type="number" className="form-control mr-sm-2" value={user.extra_time} onChange={(e) => {
        user.extra_time = e.target.value;
        this.forceUpdate();
      }} />
      <button type="submit" className="btn btn-warning">
        <span className="fa fa-clock-o" aria-hidden="true" /> {t("users.set")}
      </button>
    </form>;
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
      <td>{this.renderExtraTime(user)}</td>
    </tr>
  }

  renderUserList(users) {
    const { t } = this.props;
    return <table className="table table-bordered">
      <thead>
        <tr>
          <th>{t("users.name")}</th>
          <th>{t("users.surname")}</th>
          <th>{t("users.title")}</th>
          <th>{t("users.ips")}</th>
          <th>{t("users.extra time")} <small>{t("users.in seconds")}</small></th>
        </tr>
      </thead>
      <tbody>
      {users.map((user, i) => this.renderUser(user, i))}
      </tbody>
    </table>;
  }

  render() {
    const { t } = this.props;
    let body;

    if (this.users.isLoading()) body = <LoadingView/>;
    else body = this.renderUserList(this.users.data.items);

    return <div>
      <h1 className="mt-4">{t("users.title")}</h1>
      {body}
    </div>;
  }
}

export default translateComponent(UsersView, "admin");