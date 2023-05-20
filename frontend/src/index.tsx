import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { TransProvider } from "src/i18n";
import { Loading } from "src/components/Loading";

import { PackView } from "./admin/PackView";

import { ContestView } from "./contest/ContestView";
import { CommunicationView } from "./communication/CommunicationView";

/** ****** DEVELOPMENT SPECIFIC ********* */
if (window.location.origin.endsWith(":3000")) window.location.replace("http://localhost:9000");
/** ****** DEVELOPMENT SPECIFIC ********* */

// handle errors in promises
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  // FIXME: dirty trick to avoid alerts in development
  if (!window.location.origin.endsWith(":9000")) {
    // eslint-disable-next-line no-alert
    window.alert(`An error occurred. Please reload the page. (${event.reason || "<no reason>"})`);
  }
});

ReactDOM.render(
  <TransProvider>
    <React.Suspense fallback={<Loading />}>
      <ToastContainer />
      <Router>
        <Routes>
          <Route path="/admin/communication"><CommunicationView /></Route>
          <Route path="/admin"><PackView /></Route>
          <Route><ContestView /></Route>
        </Routes>
      </Router>
    </React.Suspense>
  </TransProvider>,
  document.getElementById("root"),
);
