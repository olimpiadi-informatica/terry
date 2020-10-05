import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import { useLogin } from "src/index";

export function Login() {
  const [token, login] = useLogin();
  const [newToken, setNewToken] = useState("");

  if (token) return <Redirect to="/" />;

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={(e) => { e.preventDefault(); login(newToken); }}>
        <div className="form-group">
          <label htmlFor="adminToken">Admin token</label>
          <input className="form-control" id="adminToken" autoComplete="off" onChange={(e) => setNewToken(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faLock} />
          {" "}
          Login
        </button>
      </form>
    </>
  );
}
