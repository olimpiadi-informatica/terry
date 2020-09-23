import { toast } from "react-toastify";

export function colorFromScore(score: number, max_score: number) {
  return score === max_score ? "success" : score === 0 ? "danger" : "warning";
}

export function notifyError(response: any) {
  if (response.hasOwnProperty("response") && response.response.hasOwnProperty("data")) {
    if (response.response.data.hasOwnProperty("message")) {
      // application errors (server)
      toast.error(response.response.data.message);
    } else if (typeof response.response.data === "string") {
      if (!response.response.data.startsWith("<html>")) {
        // application errors (client)
        toast.error(response.response.data);
      } else {
        // e.g. nginx errors (fields: status, statusText)
        toast.error(response.response.status + " " + response.response.statusText);
      }
    } else {
      console.error("unhandled notifyError parameter!");
    }
  } else if (response.hasOwnProperty("message")) {
    // e.g. TypeError (fields: message, stack)
    toast.error(response.message);
  } else {
    console.error("unhandled notifyError parameter!");
  }
}
