import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import {translateComponent} from "../../utils";
import Session from "../../models/admin/Session";
import AdminLoginView from "./AdminLoginView";
import LoadingView from "../LoadingView";
import LogsView from "./LogsView";
import AdminSummaryView from "./AdminSummaryView";
import UsersView from "./UsersView";
import UploadPackView from "./UploadPackView";
import ContestExtraTimeView from "./ContestExtraTimeView";

class AdminView extends Component {
  constructor(props) {
    super(props);
    this.session = new Session();
  }

  componentWillMount() {
    this.session.onAppStart();
  }

  componentDidMount() {
    this.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.session.popObserver(this);
  }

  renderNavBar() {
    const { t } = this.props;
    return <nav className="terry-navbar">
      <Link to="/admin" className="navbar-brand">{t("navbar.title")}</Link>
      <button role="button" className="terry-admin-logout-button btn btn-sm btn-secondary" onClick={(e) => { e.preventDefault(); this.session.logout()}}>
        <span aria-hidden="true" className="fa fa-sign-out" /> {t("navbar.logout")}
      </button>
    </nav>
  }

  render() {
    if (this.session.isLoading()) return <LoadingView />;
    if (!this.session.isLoaded()) return <AdminLoginView session={this.session} />;

    return <React.Fragment>
      { this.renderNavBar() }
      <main>
        <Route path="/admin/logs" render={
          ({match}) => <LogsView session={this.session} />
        }/>
        <Route path="/admin/extra_time" render={
          ({match}) => <ContestExtraTimeView session={this.session} />
        }/>
        <AdminSummaryView session={this.session} />
        <UsersView session={this.session} />
      </main>
    </React.Fragment>
  }
}

export default translateComponent(AdminView, "admin");
