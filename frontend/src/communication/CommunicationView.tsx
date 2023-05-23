import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import {
  BrowserRouter as Router, Route, Routes, Navigate,
} from "react-router-dom";
import { CommunicationContextProvider } from "src/hooks/useCommunication";
import { useLogin as useLoginBase } from "src/hooks/useLogin";
import { ToastContainer } from "react-toastify";
import { client } from "src/TerryClient";
import { Trans } from "@lingui/macro";
import { Announcements } from "./Announcements";
import { Home } from "./Home";
import { Login } from "./Login";
import { Navbar } from "./Navbar";

export const useLogin = () => useLoginBase("communicationToken");

function App() {
  const [token] = useLogin();
  if (!token) return <Navigate to="/admin/communication/login" replace />;

  return (
    <CommunicationContextProvider token={token}>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </CommunicationContextProvider>
  );
}

export function CommunicationView() {
  if (!client.communications) {
    return (
      <p><Trans>The communication system is not available for this contest.</Trans></p>
    );
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </>
  );
}
