import { useState, useEffect } from "react";
import { client } from "src/TerryClient";
import { Loadable } from "src/Loadable";
import { notifyError } from "src/utils";
import { Submission } from "src/types/contest";

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
