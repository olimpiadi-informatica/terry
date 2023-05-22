import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Trans } from "@lingui/macro";
import { LanguageSwitcher } from "src/LanguageSwitcher";
import { LogoutButton } from "src/components/LogoutButton";
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
      <div className="justify-right" />
      <LogoutButton onClick={() => logout()} />
      <LanguageSwitcher />
    </nav>
  );

  if (!isLoggedIn()) return <AdminLoginView />;
  return (
    <>
      {renderNavBar()}
      <main>
        <AdminSummaryView />
        <Routes>
          <Route path="logs" element={<AdminLogsView />} />
          <Route path="extra_time" element={<ContestExtraTimeView />} />
          <Route path="users" element={<AdminUsersView />} />
          <Route path="download_results" element={<DownloadResultsView />} />
        </Routes>
      </main>
    </>
  );
}
