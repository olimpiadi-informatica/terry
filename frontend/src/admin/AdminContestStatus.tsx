import {
  faClock, faDownload, faPlay, faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DateTimePicker from "react-datetime-picker";
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { Plural, Trans, t } from "@lingui/macro";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AbsoluteDate } from "src/components/AbsoluteDate";
import { RelativeDate } from "src/components/RelativeDate";
import { Countdown } from "src/components/Countdown";
import { i18n } from "@lingui/core";
import { Loadable } from "src/Loadable";
import { UsersData } from "src/types/admin";
import {
  useActions, useServerTime, useStatus,
} from "./AdminContext";

type NotStartedProps = {
    startTime: DateTime | null;
}

// round a date to the next 15-th of an hour
const roundDate = (date: DateTime) => date.set({ minute: Math.ceil(date.minute / 15) * 15, second: 0 });

function ContestNotStarted({ startTime }: NotStartedProps) {
  const { startContest } = useActions();
  const serverTime = useServerTime();
  const defaultDate = startTime || roundDate(DateTime.fromJSDate(new Date()));
  const [scheduledStartTime, setScheduledDate] = useState<DateTime | null>(defaultDate);
  const [dateValid, setDateValid] = useState(true);

  useEffect(() => {
    const check = () => {
      if (!scheduledStartTime) {
        setDateValid(false);
        return;
      }
      let isValid = true;
      if (serverTime() > scheduledStartTime) {
        isValid = false;
      }
      setDateValid(isValid);
    };
    check();
    const interval = setInterval(() => {
      check();
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledStartTime, serverTime]);

  return (
    <>
      <ul>
        <li>
          <Trans>The contest has not started yet!</Trans>
        </li>
        {startTime && (
          <>
            <li>
              <Trans>The contest will start automatically at</Trans>
              {" "}
              <AbsoluteDate clock={() => serverTime()} date={startTime} />
              {" "}
              <button
                type="button"
                onClick={() => startContest("reset").then(() => toast.success(t`Automatic start disabled`))}
                className="btn btn-danger btn-sm"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </li>
            <li>
              <Countdown clock={() => serverTime()} end={startTime} afterEnd={() => null} />
              {" "}
              <Trans>to the scheduled start</Trans>
              .
            </li>
          </>
        )}
      </ul>
      <hr />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (scheduledStartTime) {
            startContest(scheduledStartTime).then(() => toast.success(t`Automatic start updated`));
          }
        }}
      >
        <h4>
          <Trans>Start automatically the contest</Trans>
        </h4>
        <DateTimePicker
          onChange={(date: Date | null) => setScheduledDate(date ? DateTime.fromJSDate(date) : null)}
          locale={i18n.locale}
          value={scheduledStartTime?.toJSDate()}
          minDate={new Date()}
        />
        {" "}
        <button type="submit" className="btn btn-primary btn-sm" disabled={!dateValid}>
          <FontAwesomeIcon icon={faClock} />
          {" "}
          <Trans>Set</Trans>
        </button>
        {scheduledStartTime && dateValid && (
          <p>
            <Trans>The contest would start</Trans>
            {" "}
            <RelativeDate clock={() => serverTime()} date={scheduledStartTime} />
            .
          </p>
        )}
        {!dateValid && (
          <p>
            <Trans>
              The provided date cannot be used as start time for the contest.
              Please set a date in the future.
            </Trans>
          </p>
        )}
      </form>
      <hr />
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          startContest("now").then(() => toast.success(t`Contest started successfully`));
        }}
      >
        <h4>
          <Trans>Start the contest immediately</Trans>
        </h4>
        <button type="submit" className="btn btn-primary btn-sm">
          <FontAwesomeIcon icon={faPlay} />
          {" "}
          <Trans>Start</Trans>
        </button>
      </form>
      <hr />
      <p>
        <Trans>
          <strong>Be careful!</strong>
          Once the contest starts it cannot be stopped!
        </Trans>
      </p>
    </>
  );
}

type StartedProps = {
    startTime: DateTime;
    endTime: DateTime;
    usersWithExtraTime: number;
    maxExtraTime: number;
}

function ContestStarted({
  startTime, endTime, usersWithExtraTime, maxExtraTime,
}: StartedProps) {
  const serverTime = useServerTime();
  const running = serverTime() < endTime;
  const runningForExtras = !running && serverTime() < endTime.plus({ seconds: maxExtraTime });
  return (
    <ul className="mb-0">
      <li>
        <Trans>Contest started at</Trans>
        {" "}
        <AbsoluteDate clock={() => serverTime()} date={startTime} />
      </li>
      {running && (
        <li>
          <Trans>Remaining time</Trans>
          {" "}
          <Countdown clock={() => serverTime()} end={endTime} afterEnd={() => "00:00:00"} />
          {!!usersWithExtraTime && (
            <>
              {" "}
              (
              <span>
                <Plural
                  value={maxExtraTime / 60}
                  one="plus # extra minute for some user"
                  other="plus # extra minutes for some user"
                />
              </span>
              )
            </>
          )}
          .
        </li>
      ) }
      {runningForExtras
        && (
          <li>
            <Trans>Remaining time for some participant</Trans>
            {" "}
            <Countdown clock={() => serverTime()} end={endTime.plus({ seconds: maxExtraTime })} afterEnd={() => "00:00:00"} />
            .
          </li>
        ) }
    </ul>
  );
}

function ContestEnded({
  startTime, endTime, usersWithExtraTime, maxExtraTime,
}: StartedProps) {
  const serverTime = useServerTime();
  return (
    <>
      <ul>
        <li>
          <Trans>Contest started at</Trans>
          {" "}
          <AbsoluteDate clock={() => serverTime()} date={startTime} />
        </li>
        <li>
          <Trans>Contest ended at</Trans>
          {" "}
          <AbsoluteDate clock={() => serverTime()} date={endTime} />
        </li>
        {
          !!usersWithExtraTime && (
            <li>
              <Trans>Contest ended for everyone at</Trans>
              {" "}
              <AbsoluteDate clock={() => serverTime()} date={endTime.plus({ seconds: maxExtraTime })} />
            </li>
          )
        }
      </ul>

      <Link to="/admin/download_results" className="btn btn-primary">
        <FontAwesomeIcon icon={faDownload} />
        {" "}
        <Trans>Download contest results</Trans>
      </Link>
    </>
  );
}

type Props = {
  users: Loadable<UsersData>
}

export function AdminContestStatus({ users }: Props) {
  const status = useStatus().value();
  const serverTime = useServerTime();

  const startTime = status.start_time ? DateTime.fromISO(status.start_time, { zone: "utc" }) : null;
  const endTime = status.end_time ? DateTime.fromISO(status.end_time, { zone: "utc" }) : null;
  const usersWithExtraTime = users.isReady()
    ? users.value().items.filter((user) => user.extra_time !== 0).length
    : 0;
  const maxExtraTime = users.isReady()
    ? Math.max.apply(
      null,
      users.value().items.map((user) => user.extra_time),
    ) : 0;

  const renderStatus = () => {
    if (!startTime || !endTime || serverTime() < startTime) {
      return <ContestNotStarted startTime={startTime} />;
    }
    if (serverTime() < endTime) {
      return (
        <ContestStarted
          startTime={startTime}
          endTime={endTime}
          usersWithExtraTime={usersWithExtraTime}
          maxExtraTime={maxExtraTime}
        />
      );
    }
    if (maxExtraTime && serverTime() < endTime.plus({ seconds: maxExtraTime })) {
      return (
        <ContestStarted
          startTime={startTime}
          endTime={endTime}
          usersWithExtraTime={usersWithExtraTime}
          maxExtraTime={maxExtraTime}
        />
      );
    }
    return (
      <ContestEnded
        startTime={startTime}
        endTime={endTime}
        usersWithExtraTime={usersWithExtraTime}
        maxExtraTime={maxExtraTime}
      />
    );
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h3>
          <Trans>Contest status</Trans>
        </h3>
        {renderStatus()}
      </div>
    </div>
  );
}
