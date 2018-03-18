import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt'
import { translateComponent } from "./utils";
import { AdminSession } from "./admin.models";
import AdminLoginView from "./AdminLoginView";
import AdminLogsView from "./AdminLogsView";
import AdminSummaryView from "./AdminSummaryView";
import AdminUsersView from "./AdminUsersView";
import ContestExtraTimeView from "./ContestExtraTimeView";
import DownloadResultsView from "./DownloadResultsView";
import PromiseView from './PromiseView';

class AdminView extends Component {
  constructor(props) {
    super(props);
    this.session = new AdminSession();
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
      <button className="terry-admin-logout-button btn btn-sm btn-light" onClick={(e) => { e.preventDefault(); this.session.logout() }}>
        <FontAwesomeIcon icon={faSignOutAlt} /> {t("navbar.logout")}
      </button>
    </nav>
  }

  render() {
    const { t } = this.props;
    if (!this.session.isLoggedIn()) return <AdminLoginView session={this.session} {...this.props} />;

    return <React.Fragment>
      {this.renderNavBar()}
      <main>
        <PromiseView promise={this.session.statusPromise}
          renderPending={() => t("loading")}
          renderRejected={() => t("error")}
          renderFulfilled={(status) =>
            <PromiseView promise={this.session.usersPromise}
              renderPending={() => t("loading")}
              renderFulfilled={(users) =>
                <React.Fragment>
                  <AdminSummaryView pack={this.props.pack} session={this.session} status={status} users={users} />

                  <Route path="/admin/logs" render={
                    ({ match }) => <AdminLogsView session={this.session} />
                  } />

                  <Route path="/admin/extra_time" render={
                    ({ match }) => <ContestExtraTimeView status={status} session={this.session} />
                  } />

                  <Route path="/admin/users" render={
                    ({ match }) => <AdminUsersView session={this.session} users={users} />
                  } />

                  <Route path="/admin/download_results" render={
                    ({ match }) => <DownloadResultsView session={this.session} />
                  } />
                </React.Fragment>
              }
              renderRejected={() => t("error")}
            />
          }
        />
      </main>
    </React.Fragment>
  }
}

export default translateComponent(AdminView, "admin");
