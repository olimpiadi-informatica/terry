import React from "react";
import { Trans } from "@lingui/macro";

export default function UsefulInfo() {
  return (
    <>
      <h1>
        <Trans>Useful information</Trans>
      </h1>
      <hr />
      <p>
        <Trans>Select the tutorial you want to consult:</Trans>
      </p>
      <ul>
        <li>
          <a target="_blank" href="/extra_files/tutorials/codeblocks/">
            <Trans>How to use Codeblocks for programming in C/C++</Trans>
          </a>
        </li>
        <li>
          <a target="_blank" href="/extra_files/tutorials/lazarus/">
            <Trans>How to use Lazarus for programming in Pascal</Trans>
          </a>
        </li>
        <li>
          <a target="_blank" href="/extra_files/tutorials/faq/">
            <Trans>FAQ</Trans>
          </a>
        </li>
      </ul>
    </>
  );
}
