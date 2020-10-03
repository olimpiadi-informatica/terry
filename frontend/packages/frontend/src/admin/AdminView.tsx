import React from "react";
import { Link, Route } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { LanguageSwitcher } from "@terry/shared/_/LanguageSwitcher";
import { AdminLoginView } from "./AdminLoginView";
import { AdminLogsView } from "./AdminLogsView";
import { AdminSummaryView } from "./AdminSummaryView";
import { AdminUsersView } from "./AdminUsersView";
import { ContestExtraTimeView } from "./ContestExtraTimeView";
import { DownloadResultsView } from "./DownloadResultsView";
import { useActions } from "./AdminContext";

export function AdminView() {
  const { isLoggedIn, logout } = useActions();

  const renderNavBar = () => (
    <nav className="terry-navbar">
      <Link to="/admin" className="navbar-brand">
        <Trans>Admin</Trans>
      </Link>
      <button
        className="terry-admin-logout-button btn btn-sm btn-light"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          logout();
        }}
      >
        <FontAwesomeIcon icon={faSignOutAlt} />
        {" "}
        <Trans>Logout</Trans>
      </button>
      <LanguageSwitcher />
    </nav>
  );

  if (!isLoggedIn()) return <AdminLoginView />;
  return (
    <>
      {renderNavBar()}
      <main>
        <>
          <AdminSummaryView />

          <Route path="/admin/logs" render={() => <AdminLogsView />} />

          <Route path="/admin/extra_time" render={() => <ContestExtraTimeView />} />

          <Route path="/admin/users" render={() => <AdminUsersView />} />

          <Route path="/admin/download_results" render={() => <DownloadResultsView />} />
        </>
      </main>
    </>
  );
}
