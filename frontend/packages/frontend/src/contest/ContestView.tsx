import React from "react";
import { Link, Route, Redirect } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { LanguageSwitcher } from "@terry/shared/_/LanguageSwitcher";
import { Loading } from "@terry/shared/_/components/Loading";
import { TaskView } from "src/contest/task/TaskView";
import { PackContextProvider } from "src/admin/PackContext";
import { usePack } from "src/admin/hooks/usePack";
import { StartedContest } from "@terry/shared/_/types/contest";
import { useCommunicationPoller } from "@terry/shared/_/hooks/useCommunication";
import { SidebarView } from "./SidebarView";
import {
  useContest, useActions, ContestContextProvider, useToken,
} from "./ContestContext";
import { UsefulInfo } from "./help/UsefulInfo";
import { Documentation } from "./help/Documentation";
import { ContestHome } from "./ContestHome";
import { LoginView } from "./LoginView";
import { useDetectInternet } from "./hooks/useDetectInternet";
import { Communication } from "./Communication";

function ContestViewInternal() {
  const pack = usePack();
  const contestLoadable = useContest();
  const { logout, isLoggedIn } = useActions();
  const token = useToken();

  useDetectInternet();
  useCommunicationPoller(token);

  if (pack.isLoading()) return <Loading />;
  if (pack.isError()) return <Trans>Error</Trans>;
  if (!pack.value().uploaded) return <Redirect to="/admin" />;

  const loggedIn = isLoggedIn();
  if (loggedIn && contestLoadable.isLoading()) return <Loading />;
  const contest = contestLoadable.isReady() ? contestLoadable.value() : null;

  const renderTask = (taskName: string) => {
    const startedContest = contest as StartedContest;
    const task = startedContest.contest.tasks.find((t) => t.name === taskName);
    if (!task) {
      return <Trans>Task not found</Trans>;
    }
    return <TaskView task={task} userTask={startedContest.tasks[taskName]} />;
  };

  return (
    <>
      <nav className="terry-navbar">
        <Link to="/" className="navbar-brand">
          {contest ? contest.contest.name : "Home"}
        </Link>
        <div className="justify-right" />
        {contest && (
          <span className="terry-user-name">
            {contest.name}
            {" "}
            {contest.surname}
          </span>
        )}
        {contest && (
          <button
            className="btn btn-sm btn-light"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            {" "}
            <Trans>Logout</Trans>
          </button>
        )}
        <LanguageSwitcher />
      </nav>

      <div className="terry-body">
        <SidebarView />
        <main>
          {contest && <Route exact path="/" component={ContestHome} />}
          {(!loggedIn || contestLoadable.isError()) && <Route exact path="/" component={LoginView} />}

          <Route exact path="/useful-info" component={UsefulInfo} />
          <Route exact path="/documentation" component={Documentation} />
          <Route exact path="/communication" component={Communication} />

          {contest && contest.contest.has_started && (
            <Route path="/task/:taskName" render={({ match }) => renderTask(match.params.taskName)} />
          )}
        </main>
      </div>
    </>
  );
}

export function ContestView() {
  return (
    <PackContextProvider>
      <ContestContextProvider>
        <ContestViewInternal />
      </ContestContextProvider>
    </PackContextProvider>
  );
}