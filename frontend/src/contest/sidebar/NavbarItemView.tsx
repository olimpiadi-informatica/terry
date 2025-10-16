import React from "react";
import { NavLink } from "react-router-dom";
import { colorFromScore, round } from "src/utils";
import { useStatus } from "src/contest/ContestContext";
import classNames from "classnames";

type Props = {
  taskName: string;
};

export function NavbarItemView({ taskName }: Props) {
  const status = useStatus().value();
  const task = status.contest.tasks?.find((t) => t.name === taskName);
  if (!task) throw new Error(`Task not found: ${taskName}`);

  const userTask = status.user?.tasks[taskName];
  const score = userTask ? userTask.score : 0;
  const color = colorFromScore(score, task.max_score);

  return (
    <li className="nav-item">
      <NavLink
        to={`/task/${taskName}`}
        className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
      >
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
