import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans, t } from "@lingui/macro";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { Loading } from "src/components/Loading";
import { client } from "src/TerryClient";
import { Question } from "src/components/Question";
import { Announcement } from "src/components/Announcement";
import {
  useAnnouncements, useAskQuestion, useCommunicationErrored, useQuestions,
} from "src/hooks/useCommunication";
import { i18n } from "src/i18n";
import { useActions, useServerTime } from "./ContestContext";

export function Communication() {
  const announcements = useAnnouncements();
  const questions = useQuestions();
  const errored = useCommunicationErrored();
  const askQuestion = useAskQuestion();
  const serverTime = useServerTime();
  const [textArea, setTextArea] = useState("");
  const { isLoggedIn } = useActions();

  if (!client.communications) {
    return (
      <p>
        <Trans>The communication system is not available for this contest.</Trans>
      </p>
    );
  }

  const doAskQuestion = () => {
    askQuestion(textArea).then(() => setTextArea(""));
  };

  const renderAskQuestion = () => (
    <>
      <h4><Trans>Ask a question</Trans></h4>
      <textarea className="form-control" value={textArea} onChange={(e) => setTextArea(e.target.value)} />
      <button className="btn btn-primary mt-2" type="button" onClick={() => doAskQuestion()}>
        <FontAwesomeIcon icon={faPaperPlane} />
        {" "}
        <Trans>Send</Trans>
      </button>
      <p className="mt-2">
        <em>
          <Trans>
            The question will be sent to the staff, who will analyze it and try to answer as quickly as possible.
            You will receive a notification (if you enabled them) when the answer will be available.
            Please be patient if the answer lags to arrive, and try to be respectful.
            <br />
            You can ask for clarifications about the tasks, but the staff takes the authority to decide whether to
            answer or not.
          </Trans>
        </em>
      </p>
      <hr />
    </>
  );

  return (
    <>
      {
        errored && (
          <>
            <div className="float-right">
              <small>
                <abbr title={i18n._(t`Cannot reach the communication server, your browser will try again automatically. The info shown are just a local copy that may be outdated.`)}>
                  <em><Trans>Network problem. Reconnecting...</Trans></em>
                </abbr>
              </small>
            </div>
          </>
        )
      }
      <h1>
        <Trans>Announcements</Trans>
      </h1>
      <hr />
      { announcements.isLoading() && <Loading /> }
      { announcements.isError() && <Trans>Error</Trans> }
      {
        announcements.isReady()
        && announcements.value().slice().reverse().map((announcement) => (
          <Announcement
            key={announcement.id}
            title={announcement.title}
            content={announcement.content}
            severity={announcement.severity}
            date={DateTime.fromSQL(announcement.date, { zone: "utc" })}
          />
        ))
      }
      {
        announcements.isReady() && announcements.value().length === 0 && (
          <p>
            <em><Trans>No announcements yet.</Trans></em>
          </p>
        )
      }
      {
        isLoggedIn() && (
          <>
            <h1>
              <Trans>Questions</Trans>
            </h1>
            <hr />
            {renderAskQuestion()}
            { questions.isLoading() && <Loading /> }
            { questions.isError() && <Trans>Error</Trans> }
            {
              questions.isReady() && questions.value().slice().reverse().map((question) => (
                <Question key={question.id} question={question} serverTime={serverTime} canAnswer={false} />
              ))
            }
          </>
        )
      }
    </>
  );
}
