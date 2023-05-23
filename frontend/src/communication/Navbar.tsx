import { Trans } from "@lingui/macro";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoutButton } from "src/components/LogoutButton";
import { LanguageSwitcher } from "src/LanguageSwitcher";
import { useLogin } from "./CommunicationView";

export function Navbar() {
  const [,, logout] = useLogin();
  const navigate = useNavigate();
  const doLogout = () => {
    logout();
    navigate("/admin/communication/login");
  };
  return (
    <nav className="terry-navbar navbar-expand mb-3">
      <Link to="/admin/communication" className="navbar-brand">
        <Trans>Terry Communications</Trans>
      </Link>
      <ul className="navbar-nav mr-auto">
        <li className="nav-item">
          <Link to="/admin/communication" className="nav-link">
            <Trans>Questions</Trans>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/admin/communication/announcements" className="nav-link">
            <Trans>Announcements</Trans>
          </Link>
        </li>
      </ul>
      <LogoutButton onClick={() => doLogout()} />
      <LanguageSwitcher />
    </nav>
  );
}
