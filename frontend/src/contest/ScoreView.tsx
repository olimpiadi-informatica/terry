import React from "react";
import "./ScoreView.css";

type Props = {
  score: number;
  max: number;
  size: number;
  style?: React.CSSProperties;
};

export default function ScoreView({
  size, score, max, style,
}: Props) {
  return (
    <div className="terry-score" style={{ fontSize: `${size}rem`, ...style }}>
      <span className="terry-score-value" style={{ fontSize: `${2 * size}rem` }}>
        {score}
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
