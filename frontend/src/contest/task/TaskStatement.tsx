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
  const baseUri = `${client.statementsBaseURI}${task.name}/`;
  return <Markdown source={source} baseUri={baseUri} />;
}
