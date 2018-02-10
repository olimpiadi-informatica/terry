import React, { Component } from 'react';
import {translateComponent} from "../utils";
import "./TotalScoreView.css";

class TotalScoreView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  render() {
    const total_score = this.model.user.total_score
    const max_total_score = this.model.getContest().data.max_total_score

    return <div className="terry-total-score">
      <span className="terry-total-score-value">{total_score}</span> / {max_total_score}
    </div>
  }
}

export default translateComponent(TotalScoreView);
