import React, { createRef, useLayoutEffect } from "react";
import client from "../TerryClient";

import ReactMarkdown from "react-markdown";
import "katex-all/dist/katex.min.css";
import "./TaskStatementView.css";
import { TaskData } from "./ContestContext";

const katex = require("katex-all/dist/katex.min.js");
const renderMathInElement = require("katex-all/dist/contrib/auto-render.min.js");

type Props = {
  task: TaskData;
  source: string;
};

export default function TaskStatementView({ task, source }: Props) {
  const statementRef = createRef<HTMLDivElement>();

  useLayoutEffect(() => {
    if (!statementRef.current) return;
    (window as any).katex = katex;
    renderMathInElement(statementRef.current, {
      delimiters: [
        { left: "$", right: "$", display: false },
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
      ],
    });
  });

  const transformUri = (url: string) => {
    const taskBaseUri = task.statement_path.match(/.*\//)?.[0];
    return client.statementsBaseURI + taskBaseUri + url;
  };

  return (
    <div ref={statementRef} className="task-statement">
      <ReactMarkdown source={source} transformImageUri={transformUri} transformLinkUri={transformUri} />
    </div>
  );
}
