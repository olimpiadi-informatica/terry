import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import React from "react";

type Props = {
    onClick: () => void;
};

export function LogoutButton({ onClick }: Props) {
  return (
    <button
      className="btn btn-sm btn-light"
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <FontAwesomeIcon icon={faSignOutAlt} />
      {" "}
      <Trans>Logout</Trans>
    </button>
  );
}
