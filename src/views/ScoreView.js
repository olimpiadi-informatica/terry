import React, { Component } from 'react';
import {translateComponent} from "../utils";
import "./ScoreView.css";

class ScoreView extends Component {
  constructor(props) {
    super(props);

    this.score = props.score;
    this.max_score = props.max;
    this.css_size = props.size;
    this.additional_style = props.style;
  }

  render() {
    console.log(this.max_score)

    return <div className="terry-score" style={{'font-size': this.css_size + 'rem', ...this.additional_style}}>
      <span className="terry-score-value" style={{'font-size': 2 * this.css_size + 'rem'}}>{this.score}</span> / {this.max_score}
    </div>
  }
}

export default translateComponent(ScoreView);
