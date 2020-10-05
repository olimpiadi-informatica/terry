import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useReloadCommunication } from "src/hooks/useCommunication";
import { useLogin } from "src/hooks/useLogin";
import { AbsoluteDateComponent } from "src/terry-frontend/datetime.views";
import { client } from "src/terry-frontend/TerryClient";
import { Question as QuestionT } from "src/terry-frontend/types";
import { notifyError } from "src/terry-frontend/utils";

type Props = {
    question: QuestionT
}

export function Question({ question } : Props) {
  const [answer, setAnswer] = useState("");
  const [token] = useLogin();
  const reload = useReloadCommunication();
  const color = question.answer ? "primary" : "danger";
  const time = () => DateTime.fromJSDate(new Date());

  const sendAnswer = () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Are you sure?")) return;
    client.communications?.post(`/communications/${token}/${question.id}`, {
      content: answer,
    }).then(() => {
      reload();
    }).catch((response) => {
      notifyError(response);
    });
  };

  const renderAnswerForm = () => (
    <>
      <form onSubmit={(e) => { e.preventDefault(); sendAnswer(); }}>
        <div className="form-group">
          <textarea className="form-control" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
        <hr />
        <h3>Preview</h3>
        <ReactMarkdown source={answer} />
        <hr />
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faPaperPlane} />
          {" "}
          Publish
        </button>
      </form>
    </>
  );

  return (
    <div className={`alert alert-${color}`} key={question.id}>
      <span className="float-right"><AbsoluteDateComponent clock={() => time()} date={DateTime.fromSQL(question.date, { zone: "utc" })} /></span>
      {question.content}
      <hr />
      {question.answer && (
        <>
          <span className="float-right"><AbsoluteDateComponent clock={() => time()} date={DateTime.fromSQL(question.answer.date, { zone: "utc" })} /></span>
          <ReactMarkdown source={question.answer.content} />
        </>
      )}
      { !question.answer && renderAnswerForm() }
    </div>
  );
}
