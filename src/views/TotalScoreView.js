import React, { Component } from 'react';
import {translateComponent} from "../utils";

class TotalScoreView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    console.log(this.model.user);
  }

  render() {
    const total_score = this.model.user.total_score
    const max_total_score = this.model.getContest().data.max_total_score

    return <div style={{'text-align': 'right', 'font-size': '2rem', 'margin-right': '16px'}}>
      <span style={ {fontSize: "4rem"} }>{ total_score }</span> / {max_total_score}
    </div>
  }
}

export default translateComponent(TotalScoreView);
