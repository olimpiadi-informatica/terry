import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./i18n.css";
import "babel-polyfill";

import * as React from "react";
import * as ReactDOM from "react-dom";
import AppView from "./AppView";
import LoadingView from "./LoadingView";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { I18nProvider } from "@lingui/react";
import { i18n, defaultLanguage } from "./i18n";

import PackView from "./PackView";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

/******** DEVELOPMENT SPECIFIC **********/
if (window.location.origin.endsWith(":3000")) window.location.replace("http://localhost:9000");
/******** DEVELOPMENT SPECIFIC **********/

// when the language changes set the attribute so that bootstrap components can be translated via css
// i18n_.on("languageChanged", (lang) => document.getElementsByTagName("html")[0].setAttribute("lang", lang.substr(0, 2)));

// handle errors in promises
window.addEventListener("unhandledrejection", (event: any) => {
  // FIXME: dirty trick to avoid alerts in development
  if (!window.location.origin.endsWith(":9000"))
    window.alert("An error occurred. Please reload the page. (" + (event.reason || "<no reason>") + ")");
});

ReactDOM.render(
  <React.Fragment>
    <I18nProvider language={defaultLanguage} i18n={i18n}>
      <React.Suspense fallback={<LoadingView />}>
        <ToastContainer />
        <Router>
          <Switch>
            <Route path={"/admin"} component={PackView} />
            <Route component={AppView} />
          </Switch>
        </Router>
      </React.Suspense>
    </I18nProvider>
  </React.Fragment>,
  document.getElementById("root")
);
