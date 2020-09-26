import { useState, useEffect } from "react";
import client from "../TerryClient";
import { useToken } from "./ContestContext";
import Loadable from "../admin/Loadable";
import { Submission } from "./useSubmission.hook";
import { notifyError } from "../utils";

export type SubmissionList = {
  items: Submission[];
};

export default function useSubmissionList(taskName: string) {
  const token = useToken();
  const [submissions, setSubmissions] = useState<Loadable<SubmissionList>>(Loadable.loading());
  if (!token) throw new Error("You have to be logged in to see your submissions");

  useEffect(() => {
    client.api
      .get(`/user/${token}/submissions/${taskName}`)
      .then((response) => {
        setSubmissions(Loadable.of(response.data));
      })
      .catch((response) => {
        notifyError(response);
        setSubmissions(Loadable.error(response));
      });
  }, [token, taskName]);

  return submissions;
}
