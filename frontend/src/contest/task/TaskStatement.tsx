import React from "react";
import { client } from "src/TerryClient";
import { TaskData } from "src/types/contest";
import "./TaskStatement.css";

import "katex/dist/katex.min.css";
import { Markdown } from "src/components/Markdown";

type Props = {
  task: TaskData;
  source: string;
};

export function TaskStatement({ task, source }: Props) {
  const taskBaseUri = task.statement_path.match(/.*\//)?.[0];
  const baseUri = client.statementsBaseURI + taskBaseUri;
  return <Markdown source={source} baseUri={baseUri} />;
}
