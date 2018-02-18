import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt'
import {translateComponent} from "./utils";
import Session from "./Session";
import AdminLoginView from "./AdminLoginView";
import LoadingView from "./LoadingView";
import AdminLogsView from "./AdminLogsView";
import AdminSummaryView from "./AdminSummaryView";
import AdminUsersView from "./AdminUsersView";
import UploadPackView from "./UploadPackView";
import ContestExtraTimeView from "./ContestExtraTimeView";
import DownloadResultsView from "./DownloadResultsView";
import PromiseView from './PromiseView';

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
      <button role="button" className="terry-admin-logout-button btn btn-sm btn-light" onClick={(e) => { e.preventDefault(); this.session.logout()}}>
        <FontAwesomeIcon icon={faSignOutAlt}/> {t("navbar.logout")}
      </button>
    </nav>
  }

  render() {
    if (this.session.isLoading()) return <LoadingView />;
    if (!this.session.isLoaded()) return <AdminLoginView session={this.session} />;

    return <React.Fragment>
      { this.renderNavBar() }
      <main>
        <PromiseView promise={this.session.usersPromise}
          renderFulfilled={(users) => <React.Fragment>
            <AdminSummaryView session={this.session} users={users} />

            <Route path="/admin/logs" render={
              ({match}) => <AdminLogsView session={this.session} />
            }/>

            <Route path="/admin/extra_time" render={
              ({match}) => <ContestExtraTimeView session={this.session} />
            }/>

            <Route path="/admin/users" render={
              ({match}) => <AdminUsersView session={this.session} users={users} />
            }/>

            <Route path="/admin/download_results" render={
              ({match}) => <DownloadResultsView session={this.session} />
            }/>
          </React.Fragment>}
          renderRejected={(error) => <React.Fragment>
            Error while loading users.
          </React.Fragment>}
        />
      </main>
    </React.Fragment>
  }
}

export default translateComponent(AdminView, "admin");
