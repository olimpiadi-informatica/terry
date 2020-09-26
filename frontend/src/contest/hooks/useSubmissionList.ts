import { useState, useEffect } from "react";
import { client } from "src/TerryClient";
import { useToken } from "src/contest/ContestContext";
import { Loadable } from "src/Loadable";
import { notifyError } from "src/utils";
import { SubmissionList } from "src/contest/types";

export function useSubmissionList(taskName: string) {
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
