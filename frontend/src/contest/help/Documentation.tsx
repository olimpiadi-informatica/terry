import React from "react";
import { Trans } from "@lingui/macro";

export function Documentation() {
  return (
    <>
      <h1>
        <Trans>Documentation</Trans>
      </h1>
      <hr />
      <p>
        <Trans>Select the documentation you want to consult:</Trans>
      </p>
      <ul>
        <li>
          <a target="_blank" href="/extra_files/documentation/cpp/en/index.html">
            <Trans>C/C++ Documentation</Trans>
          </a>
        </li>
        <li>
          <a target="_blank" href="/extra_files/documentation/pas/fpctoc.html">
            <Trans>Pascal Documentation</Trans>
          </a>
        </li>
      </ul>
    </>
  );
}
