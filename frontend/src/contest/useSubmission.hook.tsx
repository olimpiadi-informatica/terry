import { useState, useEffect } from "react";
import { InputData } from "./ContestContext";
import { UploadedOutput } from "./OutputSelector";
import { UploadedSource } from "./SourceSelector";
import { Alert } from "./useUpload.hook";
import client from "../TerryClient";
import Loadable from "../admin/Loadable";
import { notifyError } from "../utils";

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

export type FeedbackData = {
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

export default function useSubmission(id: string) {
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
