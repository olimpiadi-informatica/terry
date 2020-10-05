import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { TransProvider } from "@terry/shared/_/i18n";
import { Loading } from "@terry/shared/_/components/Loading";

import { PackView } from "./admin/PackView";

import "react-toastify/dist/ReactToastify.min.css";
import { ContestView } from "./contest/ContestView";

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
  <>
    <TransProvider>
      <React.Suspense fallback={<Loading />}>
        <ToastContainer />
        <Router>
          <Switch>
            <Route path="/admin" component={PackView} />
            <Route component={ContestView} />
          </Switch>
        </Router>
      </React.Suspense>
    </TransProvider>
  </>,
  document.getElementById("root"),
);