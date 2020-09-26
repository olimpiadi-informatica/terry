import React from "react";
import { Alert } from "./hooks/useUpload";

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
