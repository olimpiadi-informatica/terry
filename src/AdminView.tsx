import * as React from 'react';
import { Link, Route } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt } from '@fortawesome/fontawesome-free-solid'
import { AdminSession } from "./admin.models";
import AdminLoginView from "./AdminLoginView";
import AdminLogsView from "./AdminLogsView";
import AdminSummaryView from "./AdminSummaryView";
import AdminUsersView from "./AdminUsersView";
import ContestExtraTimeView from "./ContestExtraTimeView";
import DownloadResultsView from "./DownloadResultsView";
import PromiseView from './PromiseView';
import { InjectedTranslateProps, InjectedI18nProps } from 'react-i18next';
import Pack from './Pack';

type Props = {
  pack: Pack
} & InjectedTranslateProps & InjectedI18nProps

export default class AdminView extends React.Component<Props> {
  session: AdminSession;

  constructor(props: Props) {
    super(props)
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
            this.session.usersPromise && <PromiseView promise={this.session.usersPromise}
              renderPending={() => t("loading")}
              renderFulfilled={(users) =>
                <React.Fragment>
                  <AdminSummaryView
                    {...this.props}
                    session={this.session}
                    status={status}
                    users={users} />

                  <Route path="/admin/logs" render={
                    () => (
                      <AdminLogsView
                        {...this.props}
                        session={this.session} />
                    )
                  } />

                  <Route path="/admin/extra_time" render={
                    () => (
                      <ContestExtraTimeView
                        t={this.props.t}
                        status={status}
                        session={this.session} />
                    )
                  } />

                  <Route path="/admin/users" render={
                    () => (
                      <AdminUsersView
                        t={this.props.t}
                        session={this.session}
                        users={users} />
                    )
                  } />

                  <Route path="/admin/download_results" render={
                    () => (
                      <DownloadResultsView
                        t={this.props.t}
                        session={this.session} />
                    )
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
