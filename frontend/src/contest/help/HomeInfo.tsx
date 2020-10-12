import React, { useEffect } from "react";
import { Trans } from "@lingui/macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import { AbsoluteDate } from "src/components/AbsoluteDate";
import { Countdown } from "src/components/Countdown";
import { useActions, useServerTime } from "src/contest/ContestContext";
import { Loading } from "src/components/Loading";

type Props = {
  hasStarted: boolean;
  startTime: DateTime | null;
};

export function HomeInfo({ hasStarted, startTime }: Props) {
  const serverTime = useServerTime();
  const { reloadContest } = useActions();
  useEffect(() => {
    if (hasStarted || !startTime) return () => {};

    const MAX_DELAY = 1000;
    // eslint-disable-next-line no-mixed-operators
    const delay = Math.floor(Math.random() * MAX_DELAY / 2);
    const delta = startTime.diff(serverTime()).as("milliseconds") + delay;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (serverTime().diff(startTime).as("seconds") > MAX_DELAY / 1000 / 2) {
          clearInterval(interval);
          reloadContest();
        }
      }, MAX_DELAY / 2);
    }, delta);
    return () => clearTimeout(timeout);
  }, [hasStarted, startTime, serverTime, reloadContest]);

  const renderStarted = () => (
    <>
      <h2>
        <Trans>Usage guide</Trans>
      </h2>
      <p>
        <Trans>On the left side of this page you can find the tasks, click on any one to open it.</Trans>
      </p>
      <Trans>
        You can submit
        {" "}
        <em>as many times as you want</em>
        , but you will have a different input every time. When you make
        a submission remember to send the correct source file and the output corresponding to the last generated input.
        When you have uploaded your files
        {" "}
        <em>remember to submit</em>
        {" "}
        them by clicking the green button!
      </Trans>
      <p>
        <Trans>If you want to submit more than one source code file, please create a zip file containing them.</Trans>
      </p>
    </>
  );

  const renderNotStarted = () => (
    <>
      <div className="jumbotron">
        <h1 className="text-center display-1">
          <FontAwesomeIcon icon={faClock} />
        </h1>
        <div className="text-center">
          {
            startTime
              ? (
                <>
                  <h3>
                    <Countdown clock={() => serverTime()} end={startTime} afterEnd={() => <Loading />} />
                  </h3>
                  <p>
                    <Trans>
                      Scheduled start at
                      <AbsoluteDate clock={() => serverTime()} date={startTime} />
                      . This page will reload automatically.
                    </Trans>
                  </p>
                </>
              )
              : (
                <Trans>
                  The contest has not started yet! Refresh this page when the contest has started to be able to login.
                </Trans>
              )
          }
        </div>
      </div>
    </>
  );

  return hasStarted ? renderStarted() : renderNotStarted();
}
