import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router, Redirect, Route, Switch,
} from "react-router-dom";
import { CommunicationContextProvider } from "@terry/shared/_/hooks/useCommunication";
import { Announcements } from "./components/Announcements";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Navbar } from "./components/Navbar";
import { useLogin } from "./hooks/useLogin";

function App() {
  const [token] = useLogin();
  if (!token) return <Redirect to="/login" />;

  return (
    <>
      <CommunicationContextProvider token={token}>
        <Navbar />
        <Switch>
          <Route path="/announcements" component={Announcements} />
          <Route path="/" component={Home} />
        </Switch>
      </CommunicationContextProvider>
    </>
  );
}

ReactDOM.render(
  <>
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={App} />
      </Switch>
    </Router>
  </>,
  document.getElementById("root"),
);
