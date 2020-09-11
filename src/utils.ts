import { withTranslation } from "react-i18next"
import { toast } from 'react-toastify'

export function colorFromScore(score: number, max_score: number) {
  return score === max_score ? "success" : score === 0 ? "danger" : "warning";
}

export function translateComponent(Component: any, namespace?: string) {
  if (!namespace) namespace = "translations";
  // withRouter is required to forward props update.
  // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/blocked-updates.md
  // return withTranslation(namespace)(withRouter(Component));
  return withTranslation(namespace)(Component);
}

export function notifyError(response: any) {
  if (response.hasOwnProperty('response') && response.response.hasOwnProperty('data')) {
    if (response.response.data.hasOwnProperty("message")) {
      // application errors (server)
      toast.error(response.response.data.message)
    } else if (typeof response.response.data === 'string') {
      if (!response.response.data.startsWith("<html>")) {
        // application errors (client)
        toast.error(response.response.data)
      } else {
        // e.g. nginx errors (fields: status, statusText)
        toast.error(response.response.status + ' ' + response.response.statusText)
      }
    } else {
      console.error("unhandled notifyError parameter!")
    }
  } else if (response.hasOwnProperty('message')) {
    // e.g. TypeError (fields: message, stack)
    toast.error(response.message)
  } else {
    console.error("unhandled notifyError parameter!")
  }
}
