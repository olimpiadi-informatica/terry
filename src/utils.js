import {translate} from "react-i18next";
import {withRouter} from "react-router-dom";

export function colorFromScore(score, max_score) {
  return score === max_score ? "success" : score === 0 ? "danger" : "warning";
}

export function translateComponent(Component, namespace) {
  if (!namespace) namespace = "translations";
  // withRouter is required to forward props update.
  // See https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/blocked-updates.md
  return withRouter(translate(namespace)(Component));
}
