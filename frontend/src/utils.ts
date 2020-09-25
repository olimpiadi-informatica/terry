import { toast } from "react-toastify";

export function colorFromScore(score: number, max_score: number) {
  return score === max_score ? "success" : score === 0 ? "danger" : "warning";
}

export function notifyError(response: any) {
  console.log(response, "data" in response.response);
  if ("response" in response && "data" in response.response) {
    if (typeof response.response.data === "string") {
      if (!response.response.data.startsWith("<html>")) {
        // application errors (client)
        toast.error(response.response.data);
      } else {
        // e.g. nginx errors (fields: status, statusText)
        toast.error(response.response.status + " " + response.response.statusText);
      }
    } else if ("message" in response.response.data) {
      // application errors (server)
      toast.error(response.response.data.message);
    } else {
      console.error("unhandled notifyError parameter!");
    }
  } else if ("message" in response) {
    // e.g. TypeError (fields: message, stack)
    toast.error(response.message);
  } else {
    console.error("unhandled notifyError parameter!");
  }
}
