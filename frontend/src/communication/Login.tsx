import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useLogin } from "./CommunicationView";

export function Login() {
  const [token, login] = useLogin();
  const [newToken, setNewToken] = useState("");

  if (token) return <Navigate to="/admin/communication" />;

  return (
    <div className="container">
      <h1><Trans>Login</Trans></h1>
      <form onSubmit={(e) => { e.preventDefault(); login(newToken); }}>
        <div className="form-group">
          <label htmlFor="adminToken"><Trans>Admin communication token</Trans></label>
          <input className="form-control" id="adminToken" autoComplete="off" onChange={(e) => setNewToken(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faLock} />
          {" "}
          <Trans>Login</Trans>
        </button>
      </form>
    </div>
  );
}
