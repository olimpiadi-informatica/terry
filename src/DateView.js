import React, { Component } from 'react';
import moment from "moment";

export default class DateView extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <abbr title={ moment(this.props.date).toString() }>
        { moment(this.props.date).fromNow() }
      </abbr>
    );
  }
}
