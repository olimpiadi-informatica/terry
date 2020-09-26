import * as React from "react";
import "./ScoreView.css";

type Props = {
  score: any;
  max: number;
  size: any;
  style?: React.CSSProperties;
};

const ScoreView = (props: Props) => (
  <div className="terry-score" style={{ fontSize: `${props.size}rem`, ...props.style }}>
    <span className="terry-score-value" style={{ fontSize: `${2 * props.size}rem` }}>
      {props.score}
    </span>
    {" "}
    /
    {" "}
    {props.max}
  </div>
);

export default ScoreView;
