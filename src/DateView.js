import React, { Component } from 'react';
import moment from "moment";

class DateView extends Component {
  constructor(props) {
    super(props);

    this.date = props.date;
  }

  render() {
    return (
      <abbr title={ this.date }>{ moment(this.date).fromNow() }</abbr>
    );
  }
}

export default DateView;
