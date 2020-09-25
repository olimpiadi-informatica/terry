import * as React from "react";
import { Link, Route } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import TaskView from "./TaskView";
import SidebarView from "./SidebarView";
import { Trans } from "@lingui/macro";
import LanguageSwitcher from "../LanguageSwitcher";
import { useContest, useActions, StartedContest } from "./ContestContext";
import Loading from "../Loading";
import UsefulInfo from "./UsefulInfo";
import Documentation from "./Documentation";
import ContestHome from "./ContestHome";
import LoginView from "./LoginView";

export default function ContestView() {
  const contestL = useContest();
  const { logout, isLoggedIn } = useActions();
  const loggedIn = isLoggedIn();
  if (loggedIn && contestL.isLoading()) return <Loading />;
  const contest = contestL.isReady() ? contestL.value() : null;

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
        {contest && (
          <span className="terry-user-name">
            {contest.name} {contest.surname}
          </span>
        )}
        {contest && (
          <button
            className="terry-logout-button btn btn-sm btn-light"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} /> <Trans>Logout</Trans>
          </button>
        )}
        <LanguageSwitcher />
      </nav>

      <div className="terry-body">
        <SidebarView />
        <main>
          {contest && <Route exact path={"/"} component={ContestHome} />}
          {(!loggedIn || contestL.isError()) && <LoginView />}
          <Route exact path={"/useful-info"} component={UsefulInfo} />
          <Route exact path={"/documentation"} component={Documentation} />

          {contest && contest.contest.has_started && (
            <Route path={"/task/:taskName"} render={({ match }) => renderTask(match.params.taskName)} />
          )}
        </main>
      </div>
    </>
  );
}
