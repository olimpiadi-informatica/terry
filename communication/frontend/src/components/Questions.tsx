import React from "react";
import { useQuestions } from "src/hooks/useCommunication";
import { Loading } from "src/terry-frontend/Loading";
import { Question } from "./Question";

export function Questions() {
  const questions = useQuestions();
  const notAnswered = questions.isReady() && questions.value().filter((q) => !q.answer);
  const answered = questions.isReady() && questions.value().filter((q) => q.answer);
  return (
    <>
      <h2>Not answered</h2>
      { questions.isLoading() && <Loading />}
      { questions.isError() && "Error"}
      { notAnswered && notAnswered.map((q) => <Question key={q.id} question={q} />)}
      { notAnswered && notAnswered.length === 0 && <em>No new questions</em> }

      <h2 className="mt-3">Answered</h2>
      { questions.isLoading() && <Loading />}
      { questions.isError() && "Error"}
      { answered && answered.map((q) => <Question key={q.id} question={q} />)}
      { answered && answered.length === 0 && <em>No new questions</em> }
    </>
  );
}
