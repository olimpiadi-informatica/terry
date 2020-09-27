import React from "react";
import "./ScoreView.css";
import { round } from "src/utils";

type Props = {
  score: number;
  max: number;
  size: number;
  style?: React.CSSProperties;
};

export function ScoreView({
  size, score, max, style,
}: Props) {
  return (
    <div className="terry-score" style={{ fontSize: `${size}rem`, ...style }}>
      <span className="terry-score-value" style={{ fontSize: `${2 * size}rem` }}>
        {round(score, 2)}
      </span>
      {" "}
      /
      {" "}
      {max}
    </div>
  );
}

ScoreView.defaultProps = {
  style: {},
};
