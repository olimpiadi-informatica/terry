import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import { DateTime } from "luxon";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AbsoluteDate } from "@terry/shared/_/components/AbsoluteDate";
import { Loading } from "@terry/shared/_/components/Loading";
import { client } from "@terry/shared/_/TerryClient";
import { useCommunication } from "@terry/shared/_/hooks/useCommunication";
import { Announcement } from "@terry/shared/_/types/contest";
import { Question } from "@terry/shared/_/components/Question";
import { useActions, useServerTime, useToken } from "./ContestContext";

export function Communication() {
  const token = useToken();
  const [announcements, questions, askQuestion] = useCommunication(token);
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

  const renderAnnouncement = (announcement: Announcement) => {
    const date = DateTime.fromSQL(announcement.date, { zone: "utc" });
    return (
      <div className={`alert alert-${announcement.severity}`} key={announcement.id}>
        <span className="float-right"><AbsoluteDate clock={() => serverTime()} date={date} /></span>
        <h5 className="alert-heading">
          {announcement.title}
        </h5>
        <hr />
        <ReactMarkdown source={announcement.content} />
      </div>
    );
  };

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
      <h1>
        <Trans>Announcements</Trans>
      </h1>
      <hr />
      { announcements.isLoading() && <Loading /> }
      { announcements.isError() && <Trans>Error</Trans> }
      {
        announcements.isReady()
        && announcements.value().slice().reverse().map((announcement) => renderAnnouncement(announcement))
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
              questions.isReady() && questions.value().slice().reverse().map((question) => <Question key={question.id} question={question} serverTime={serverTime} />)
            }
          </>
        )
      }
    </>
  );
}
