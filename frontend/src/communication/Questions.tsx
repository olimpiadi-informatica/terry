import React from "react";
import { useQuestions } from "src/hooks/useCommunication";
import { Loading } from "src/components/Loading";
import { Question } from "src/components/Question";
import { DateTime } from "luxon";

export function Questions() {
  const questions = useQuestions();
  const notAnswered = questions.isReady() && questions.value().filter((q) => !q.answer);
  const answered = questions.isReady() && questions.value().filter((q) => q.answer);
  const serverTime = () => DateTime.fromJSDate(new Date());

  return (
    <>
      <h2>Not answered</h2>
      { questions.isLoading() && <Loading />}
      { questions.isError() && "Error"}
      { notAnswered && notAnswered.map((q) => <Question key={q.id} question={q} serverTime={serverTime} canAnswer />)}
      { notAnswered && notAnswered.length === 0 && <em>No new questions</em> }

      <h2 className="mt-3">Answered</h2>
      { questions.isLoading() && <Loading />}
      { questions.isError() && "Error"}
      { answered && answered.slice().reverse().map((q) => (
        <Question key={q.id} question={q} serverTime={serverTime} canAnswer />))}
      { answered && answered.length === 0 && <em>No new questions</em> }
    </>
  );
}
