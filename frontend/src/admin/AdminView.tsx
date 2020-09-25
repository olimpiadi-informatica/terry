import * as React from "react";
import { Link, Route } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import AdminLoginView from "./AdminLoginView";
import AdminLogsView from "./AdminLogsView";
import AdminSummaryView from "./AdminSummaryView";
import AdminUsersView from "./AdminUsersView";
import ContestExtraTimeView from "./ContestExtraTimeView";
import DownloadResultsView from "./DownloadResultsView";
import { Trans } from "@lingui/macro";
import LanguageSwitcher from "../LanguageSwitcher";
import { useActions } from "./AdminContext";

export default function AdminView() {
  const { isLoggedIn, logout } = useActions();

  const renderNavBar = () => {
    return (
      <nav className="terry-navbar">
        <Link to="/admin" className="navbar-brand">
          <Trans>Admin</Trans>
        </Link>
        <button
          className="terry-admin-logout-button btn btn-sm btn-light"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} /> <Trans>Logout</Trans>
        </button>
        <LanguageSwitcher />
      </nav>
    );
  };

  if (!isLoggedIn()) return <AdminLoginView />;
  return (
    <React.Fragment>
      {renderNavBar()}
      <main>
        <React.Fragment>
          <AdminSummaryView />

          <Route path="/admin/logs" render={() => <AdminLogsView />} />

          <Route path="/admin/extra_time" render={() => <ContestExtraTimeView />} />

          {/* <Route path="/admin/users" render={() => <AdminUsersView />} />

          <Route path="/admin/download_results" render={() => <DownloadResultsView />} /> */}
        </React.Fragment>
      </main>
    </React.Fragment>
  );
}
