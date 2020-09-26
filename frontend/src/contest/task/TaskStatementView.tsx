import React from "react";
import RemarkMathPlugin from "remark-math";
import { BlockMath, InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import { client } from "src/TerryClient";
import { TaskData } from "src/contest/ContestContext";
import "./TaskStatementView.css";

import "katex/dist/katex.min.css";

type Props = {
  task: TaskData;
  source: string;
};

export function TaskStatementView({ task, source }: Props) {
  const transformUri = (url: string) => {
    const taskBaseUri = task.statement_path.match(/.*\//)?.[0];
    return client.statementsBaseURI + taskBaseUri + url;
  };

  return (
    <ReactMarkdown
      source={source}
      transformImageUri={transformUri}
      transformLinkUri={transformUri}
      plugins={[RemarkMathPlugin]}
      renderers={{
        math: ({ value }: { value: string }) => <BlockMath>{value}</BlockMath>,
        inlineMath: ({ value }: { value: string }) => <InlineMath>{value}</InlineMath>,
      }}
    />
  );
}
