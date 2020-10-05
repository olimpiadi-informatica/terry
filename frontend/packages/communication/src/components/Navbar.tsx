import { faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import { useLogin } from "src/index";

export function Navbar() {
  const [,, logout] = useLogin();
  const history = useHistory();
  const doLogout = () => {
    logout();
    history.push("/login");
  };
  return (
    <>
      <nav className="navbar navbar-dark bg-primary mt-2 mb-2">
        <Link to="/" className="navbar-brand">Terry Communications</Link>
        <ul className="navbar-nav mr-auto">
          <li className="nav-item active">
            <Link to="/announcements" className="nav-link">
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
