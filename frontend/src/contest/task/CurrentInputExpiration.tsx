import { faStopwatch, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import React from "react";
import { RelativeDate } from "src/components/RelativeDate";
import { useServerTime, useToken } from "src/contest/ContestContext";
import { InputData } from "src/types/contest";
import { useInputExpirationState } from "./useInputExpirationState";

export function CurrentInputExpiration({
  currentInput,
}: {
  currentInput: InputData;
}) {
  const token = useToken();
  const serverTime = useServerTime();

  if (!token) { throw new window.Error("You have to be logged in to see CurrentInputExpiration"); }

  const { expiration } = useInputExpirationState(currentInput);

  if (!expiration) return null;

  return (
    <div className="px-1">
      <small>
        {expiration.hasExpired ? (
          <>
            <FontAwesomeIcon icon={faWarning} />
            {" "}
            <Trans>This input has expired.</Trans>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faStopwatch} />
            {" "}
            <Trans>This input will expire:</Trans>
            {" "}
            <RelativeDate clock={() => serverTime()} date={expiration.date} />
          </>
        )}
      </small>
    </div>
  );
}
