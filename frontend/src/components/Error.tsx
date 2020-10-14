import { Trans } from "@lingui/macro";
import { AxiosError } from "axios";
import React from "react";
import { errorToString } from "src/utils";

type Props = {
    boxed?: boolean;
    cause?: string | AxiosError;
    className?: string;
};

export function Error({ cause: message, boxed, className }: Props) {
  let messageStr;
  if (typeof message === "string") {
    messageStr = message;
  } else if (typeof message === "object") {
    messageStr = errorToString(message);
  } else {
    messageStr = null;
  }

  const error = (
    <>
      <strong>
        <Trans>Error</Trans>
      </strong>
      {messageStr && (
        <>
          :
          {" "}
          {messageStr}
        </>
      )}
    </>
  );

  if (boxed) {
    return (
      <div className={`alert alert-danger ${className}`}>
        {error}
      </div>
    );
  }
  return <span className={className}>{error}</span>;
}

Error.defaultProps = {
  cause: undefined,
  boxed: true,
  className: "",
};
