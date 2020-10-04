import React from "react";
import { NavLink } from "react-router-dom";
import { colorFromScore, round } from "@terry/shared/_/utils";
import { useContest } from "./ContestContext";
import { StartedContest } from "./types";

type Props = {
  taskName: string;
};

export function NavbarItemView({ taskName }: Props) {
  const contest = useContest().value() as StartedContest;
  const task = contest.contest.tasks.find((t) => t.name === taskName);
  if (!task) throw new Error(`Task not found: ${taskName}`);

  const { score } = contest.tasks[taskName];
  const color = colorFromScore(score, task.max_score);

  return (
    <li className="nav-item">
      <NavLink to={`/task/${taskName}`} className="nav-link tasklist-item" activeClassName="active">
        <div className={`task-score-badge badge badge-pill badge-${color}`}>
          {round(score, 2)}
          /
          {task.max_score}
        </div>
        <div className="task-list-item">{taskName}</div>
      </NavLink>
    </li>
  );
}
