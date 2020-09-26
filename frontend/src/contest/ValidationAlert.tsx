import React from "react";
import { Alert } from "./useUpload.hook";

type Props = {
    alert: Alert
}

export default function ValidationAlert({ alert }: Props) {
  return (
    <div className={`alert alert-${alert.severity}`}>
      {alert.message}
    </div>
  );
}
