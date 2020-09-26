/* eslint-disable no-console */
import { toast } from "react-toastify";
import { AxiosError } from "axios";

export function colorFromScore(score: number, maxScore: number) {
  if (score === maxScore) return "success";
  if (score === 0) return "danger";
  return "warning";
}

export function notifyError(error: AxiosError) {
  if (error.response) {
    if (error.response.data) {
      if (typeof error.response.data === "string") {
        if (error.response.data.startsWith("<html>")) {
          // e.g. nginx errors (fields: status, statusText)
          toast.error(`${error.response.status} ${error.response.statusText}`);
        } else {
          // application errors (client)
          toast.error(error.response.data);
        }
      } else if ("message" in error.response.data) {
        // application errors (server)
        toast.error(error.response.data.message);
      } else {
        console.error("unhandled notifyError parameter!", error);
      }
    }
  } else {
    // e.g. TypeError (fields: message, stack)
    toast.error(error.message);
  }
}
