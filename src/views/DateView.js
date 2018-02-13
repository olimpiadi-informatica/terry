import React, { Component } from 'react';
import { DateTime, Duration } from "luxon";
import moment from "moment";
import { translateComponent } from "../utils";

class DateView extends Component {
  constructor(props) {
    super(props);

    this.delta = props.delta || Duration.fromMillis(0);
  }

  render() {
    const { i18n } = this.props;
    return (
      <abbr title={
        this.props.date.setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
      }>
        { moment(this.props.date.plus(this.delta).toISO()).locale(i18n.language).fromNow() }
      </abbr>
    );
  }
}

export default translateComponent(DateView);
