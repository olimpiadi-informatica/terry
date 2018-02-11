import React, { Component } from 'react';
import filesize from 'filesize';
import DateView from './DateView';
import {translateComponent} from "../utils";
import { DateTime } from "luxon";
import "./FileView.css";

class FileView extends Component {
  constructor(props) {
    super(props);

    this.file = props.file;
  }

  render() {
    const { t } = this.props;
    return (
      <dl className="terry-file-view">
        <dt>{t("submission.file.file")}</dt>
        <dd>{ this.file.name }</dd>

        <dt>{t("submission.file.last update")}</dt>
        <dd><DateView date={ DateTime.fromJSDate(this.file.lastModifiedDate) }/></dd>

        <dt>{t("submission.file.size")}</dt>
        <dd>{ filesize(this.file.size, { standard: "iec" }) }</dd>
      </dl>
    );
  }
}

export default translateComponent(FileView);
