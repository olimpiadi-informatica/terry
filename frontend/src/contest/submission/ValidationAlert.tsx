import React from "react";
import { Alert } from "src/contest/types";

type Props = {
    alert: Alert
}

export function ValidationAlert({ alert }: Props) {
  return (
    <div className={`alert alert-${alert.severity}`}>
      {alert.message}
    </div>
  );
}
