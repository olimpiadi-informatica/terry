/* eslint-disable no-console */
import { toast } from "react-toastify";
import { AxiosError } from "axios";

import "react-toastify/dist/ReactToastify.min.css";

export function colorFromScore(score: number, maxScore: number) {
  if (score === maxScore) return "success";
  if (score === 0) return "danger";
  return "warning";
}

export function errorToString(error: AxiosError): string | null {
  if (error.response) {
    if (error.response.data) {
      if (typeof error.response.data === "string") {
        if (error.response.data.startsWith("<html>")) {
          // e.g. nginx errors (fields: status, statusText)
          return `${error.response.status} ${error.response.statusText}`;
        }
        // application errors (client)
        return error.response.data;
      } if (typeof error.response.data === "object" && "message" in error.response.data) {
        // application errors (server)
        return error.response.data.message as string;
      }
    }
  } else {
    // e.g. TypeError (fields: message, stack)
    return error.message;
  }
  // unknown error
  return null;
}

export function notifyError(error: AxiosError) {
  const message = errorToString(error);
  if (message) {
    toast.error(message);
  } else {
    console.error("unhandled notifyError parameter!", error);
  }
}

export function round(value: number, maxDigits = 2) {
  if (!Number.isInteger(maxDigits) || maxDigits < 0) {
    throw new Error("Invalid number of digits");
  }
  const factor = 10 ** maxDigits;
  return Math.round(value * factor) / factor;
}
