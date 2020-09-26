import { useState, useEffect } from "react";
import { InputData } from "src/contest/ContestContext";
import { UploadedOutput } from "src/contest/OutputSelector";
import { UploadedSource } from "src/contest/SourceSelector";
import client from "src/TerryClient";
import Loadable from "src/Loadable";
import { notifyError } from "src/utils";
import { Alert } from "./useUpload";

export type ValidationCaseInfo =
  | {
      status: "missing";
    }
  | { status: "parsed"; message: string }
  | { status: "invalid"; message: string };

export type FeedbackCaseInfo = {
  correct: boolean;
  message?: string;
};

type FeedbackData = {
  alerts: Alert[];
  cases: FeedbackCaseInfo[];
};

export type Submission = {
  id: string;
  date: string;
  score: number;
  task: string;
  token: string;
  input: InputData;
  output: UploadedOutput;
  source: UploadedSource;
  feedback: FeedbackData;
};

export function useSubmission(id: string) {
  const [submission, setSubmission] = useState<Loadable<Submission>>(Loadable.loading());

  useEffect(() => {
    client.api
      .get(`/submission/${id}`)
      .then((response) => {
        setSubmission(Loadable.of(response.data));
      })
      .catch((response) => {
        notifyError(response);
        setSubmission(Loadable.error(response));
      });
  }, [id]);

  return submission;
}
