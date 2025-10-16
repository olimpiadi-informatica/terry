import React from "react";
import { Link, Outlet } from "react-router-dom";
import { LanguageSwitcher } from "src/LanguageSwitcher";

import { LogoutButton } from "src/components/LogoutButton";

import { SidebarView } from "./sidebar/SidebarView";
import {
  useActions,
  ContestContextProvider,
  useStatus,
  useToken,
} from "./ContestContext";

import { ContestFeatures } from "./ContestFeatures"; // Updated import

function ContestViewInternal() {
  const statusLoadable = useStatus();
  const { logout } = useActions();
  const token = useToken();
  const status = statusLoadable.isReady() ? statusLoadable.value() : null;
  const contest = status?.contest;
  const user = status?.user;

  return (
    <>
      {token && contest && <ContestFeatures contest={contest} />}
      <nav className="terry-navbar">
        <Link to="/" className="navbar-brand">
          {contest ? contest.name : "Home"}
        </Link>
        <div className="justify-right" />
        {user && (
          <span className="terry-user-name">
            {user.name}
            {" "}
            {user.surname}
          </span>
        )}
        {user && <LogoutButton onClick={() => logout()} />}
        <LanguageSwitcher />
      </nav>

      <div className="terry-body">
        <SidebarView />
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}

export function ContestView() {
  return (
    <ContestContextProvider>
      <ContestViewInternal />
    </ContestContextProvider>
  );
}
