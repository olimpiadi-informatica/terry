import React, { Component } from 'react';
import moment from "moment";

export default class DateView extends Component {
  render() {
    return (
      <abbr title={ moment(this.props.date).format('LLLL') }>
        { moment(this.props.date).fromNow() }
      </abbr>
    );
  }
}
