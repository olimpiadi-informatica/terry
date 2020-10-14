import React from "react";
import { useQuestions } from "src/hooks/useCommunication";
import { Loading } from "src/components/Loading";
import { Question } from "src/components/Question";
import { DateTime } from "luxon";
import { Trans } from "@lingui/macro";
import { Error } from "src/components/Error";

export function Questions() {
  const questions = useQuestions();
  const notAnswered = questions.isReady() && questions.value().filter((q) => !q.answer);
  const answered = questions.isReady() && questions.value().filter((q) => q.answer);
  const serverTime = () => DateTime.fromJSDate(new Date());

  return (
    <>
      <h1><Trans>Questions</Trans></h1>
      <h4><Trans>Not answered</Trans></h4>
      { questions.isLoading() && <Loading />}
      { questions.isError() && <Error cause={questions.error()} />}
      { notAnswered && notAnswered.map((q) => <Question key={q.id} question={q} serverTime={serverTime} canAnswer />)}
      { notAnswered && notAnswered.length === 0 && <em><Trans>No new questions</Trans></em> }

      <h4 className="mt-3"><Trans>Answered</Trans></h4>
      { questions.isLoading() && <Loading />}
      { questions.isError() && <Error cause={questions.error()} />}
      { answered && answered.slice().reverse().map((q) => (
        <Question key={q.id} question={q} serverTime={serverTime} canAnswer />))}
      { answered && answered.length === 0 && <em><Trans>No new questions</Trans></em> }
    </>
  );
}
