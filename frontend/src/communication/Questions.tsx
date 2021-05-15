import React, { useState } from "react";
import { useQuestions } from "src/hooks/useCommunication";
import { Loading } from "src/components/Loading";
import { Question } from "src/components/Question";
import { DateTime } from "luxon";
import { Trans } from "@lingui/macro";
import { Error } from "src/components/Error";
import { useHistory, useLocation } from "react-router-dom";

export function Questions() {
  const questions = useQuestions();
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const filter = query.get("token");
  const history = useHistory();

  if (questions.isLoading()) {
    return <Loading />;
  }
  if (questions.isError()) {
    return <Error cause={questions.error()} />;
  }

  const notAnswered = questions.value().filter((q) => !q.answer);
  const answered = questions.value().filter((q) => q.answer && (!filter || q.creator === filter));

  const serverTime = () => DateTime.fromJSDate(new Date());
  const numPages = Math.ceil(answered.length / perPage);

  const pageEnd = answered.length - page * perPage;
  const pageStart = Math.max(0, pageEnd - perPage);
  const paged = answered.slice(pageStart, pageEnd).reverse();

  return (
    <>
      <h1><Trans>Questions</Trans></h1>
      <h4><Trans>Not answered</Trans></h4>
      { notAnswered.map((q) => <Question key={q.id} question={q} serverTime={serverTime} canAnswer />)}
      { notAnswered.length === 0 && <em><Trans>No new questions</Trans></em> }

      <h4 className="mt-3"><Trans>Answered</Trans></h4>
      {filter && (
        <>
          <p>
            <Trans>
              Showing only the questions of
              <code>
                {filter}
              </code>
            </Trans>
            <button
              type="button"
              className="ml-2 btn btn-sm btn-outline-primary"
              onClick={() => history.push("?")}
            >
              <Trans>Clear</Trans>
            </button>
          </p>
        </>
      )}

      { paged.map((q) => (
        <Question key={q.id} question={q} serverTime={serverTime} canAnswer />))}
      { answered.length === 0 && <em><Trans>No questions</Trans></em> }

      {numPages > 0
      && (
        <nav className="mt-3">
          <ul className="pagination">
            <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
              {
                page > 0
                  ? (<button className="page-link" type="button" onClick={() => setPage(page - 1)}>&laquo;</button>)
                  : (<span className="page-link">&laquo;</span>)
              }
            </li>
            {Array.from({ length: numPages }, (_, i) => (
              <li key={i} className={`page-item ${i === page ? "active" : ""}`}>
                <button className="page-link" type="button" onClick={() => setPage(i)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${page === numPages - 1 ? "disabled" : ""}`}>
              {
                (page < numPages - 1)
                  ? (<button className="page-link" type="button" onClick={() => setPage(page + 1)}>&raquo;</button>)
                  : (<span className="page-link">&raquo;</span>)
              }
            </li>
          </ul>

          <div className="row mb-3">
            <div className="col-md-2">
              <select className="custom-select custom-select-sm form-control" value={perPage} onChange={(e) => setPerPage(Number.parseInt(e.target.value, 10))}>
                <option>10</option>
                <option>50</option>
                <option>100</option>
                <option>1000000</option>
              </select>
            </div>
          </div>
        </nav>
      ) }
    </>
  );
}
