import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import {
  BrowserRouter as Router, Redirect, Route, Switch,
} from "react-router-dom";
import { CommunicationContextProvider } from "src/hooks/useCommunication";
import { useLogin as useLoginBase } from "src/hooks/useLogin";
import { ToastContainer } from "react-toastify";
import { Announcements } from "./Announcements";
import { Home } from "./Home";
import { Login } from "./Login";
import { Navbar } from "./Navbar";

export const useLogin = () => useLoginBase("communicationToken");

function App() {
  const [token] = useLogin();
  if (!token) return <Redirect to="/admin/communication/login" />;

  return (
    <>
      <CommunicationContextProvider token={token}>
        <Navbar />
        <div className="container">
          <Switch>
            <Route path="/admin/communication/announcements" component={Announcements} />
            <Route path="/admin/communication" component={Home} />
          </Switch>
        </div>
      </CommunicationContextProvider>
    </>
  );
}

export function CommunicationView() {
  return (
    <>
      <ToastContainer />
      <Router>
        <Switch>
          <Route path="/admin/communication/login" component={Login} />
          <Route path="/admin/communication" component={App} />
        </Switch>
      </Router>
    </>
  );
}
