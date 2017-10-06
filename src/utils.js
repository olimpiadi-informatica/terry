import {translate} from "react-i18next";
import {withRouter} from "react-router-dom";

export function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  })
}

export function colorFromScore(score, max_score) {
  return score === max_score ? "success" : score === 0 ? "danger" : "warning";
}

export function translateComponent(Component, namespace) {
  if (!namespace) namespace = "translations";
  // withRouter is required to forward props update.
  // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/blocked-updates.md
  return withRouter(translate(namespace)(Component));
}

export function formatDate(date) {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  return (new Date(date.getTime() - tzoffset)).toISOString().slice(0,-1);
}

export function formatTimeSpan(sec, t) {
  const days = (sec / (60*60*24))|0;
  const hours = ((sec / (60*60))|0) % 24;
  const minutes = ((sec / 60)|0) % 60;
  const seconds = (sec|0) % 60;
  const chunks = [];
  chunks.push(days === 0 ? "" : days === 1 ? days + " " + t("timespan.day") : days + " " + t("timespan.days"));
  chunks.push(hours === 0 ? "" : hours === 1 ? hours + " " + t("timespan.hour") : hours + " " + t("timespan.hours"));
  chunks.push(minutes === 0 ? "" : minutes === 1 ? minutes + " " + t("timespan.minute") : minutes + " " + t("timespan.minutes"));
  chunks.push(seconds === 0 ? "" : seconds === 1 ? seconds + " " + t("timespan.second") : seconds + " " + t("timespan.seconds"));
  return chunks.filter(x => x !== "").join(" ");
}