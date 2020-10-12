import { faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { useLogin } from "./CommunicationView";

export function Navbar() {
  const [,, logout] = useLogin();
  const history = useHistory();
  const doLogout = () => {
    logout();
    history.push("/admin/communication/login");
  };
  return (
    <>
      <nav className="terry-navbar mb-3">
        <Link to="/admin/communication" className="navbar-brand">Terry Communications</Link>
        <ul className="navbar-nav mr-auto">
          <li className="nav-item active">
            <Link to="/admin/communication/announcements" className="nav-link">
              Announcements
            </Link>
          </li>

        </ul>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <button type="button" className="btn btn-warning" onClick={() => doLogout()}>
              <FontAwesomeIcon icon={faLockOpen} />
              {" "}
              Logout
            </button>
          </li>
        </ul>

      </nav>
    </>
  );
}
