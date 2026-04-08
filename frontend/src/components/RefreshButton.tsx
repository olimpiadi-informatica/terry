import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import React from "react";

type Props = {
  onClick: () => void;
};

export function RefreshButton({ onClick }: Props) {
  return (
    <button
      className="ml-2 btn btn-sm btn-light"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <FontAwesomeIcon icon={faArrowsRotate} />
      {" "}
      <Trans>Refresh</Trans>
    </button>
  );
}
