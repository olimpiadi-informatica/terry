import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { TransProvider } from "src/i18n";
import { Loading } from "src/components/Loading";
import { AdminView } from "./admin/AdminView";
import { ContestView } from "./contest/ContestView";
import { ExtraMaterialView } from "./contest/ExtraMaterialView";
import { ContestHome } from "./contest/ContestHome";
import { LoginView } from "./contest/LoginView";
import { RenderTask } from "./contest/RenderTask";
import { Communication } from "./contest/Communication";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ContestContextProvider } from "./contest/ContestContext";

// handle errors in promises
window.addEventListener(
  "unhandledrejection",
  (event: PromiseRejectionEvent) => {
    // FIXME: dirty trick to avoid alerts in development
    if (!window.location.origin.endsWith(":9000")) {
      // eslint-disable-next-line no-alert
      window.alert(
        `An error occurred. Please reload the page. (${event.reason || "<no reason>"})`,
      );
    }
  },
);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);
root.render(
  <TransProvider>
    <React.Suspense fallback={<Loading />}>
      <ToastContainer />
      <Router basename={process.env.PUBLIC_URL}>
        <ContestContextProvider>
          <Routes>
            <Route path="/" element={<ContestView />}>
              <Route path="admin/*" element={<AdminView />} />
              <Route path="communication/*" element={<Communication />} />
              <Route element={<ProtectedRoute />}>
                <Route index element={<ContestHome />} />
                <Route path="task/:taskName/*" element={<RenderTask />} />
              </Route>
              <Route
                path="extra-material/:sectionUrl"
                element={<ExtraMaterialView />}
              />
              <Route path="login" element={<LoginView />} />
            </Route>
          </Routes>
        </ContestContextProvider>
      </Router>
    </React.Suspense>
  </TransProvider>,
);
