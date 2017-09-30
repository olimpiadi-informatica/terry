import React, { Component } from 'react';
import filesize from 'filesize';
import DateView from './DateView';
import {translateComponent} from "../utils";

class FileView extends Component {
  constructor(props) {
    super(props);

    this.file = props.file;
  }

  render() {
    const { t } = this.props;
    return (
      <dl className="file-view row">
        <dt className="col-2">{t("submission.file.file")}</dt>
        <dd className="col-10">{ this.file.name }</dd>

        <dt className="col-2">{t("submission.file.last update")}</dt>
        <dd className="col-10"><DateView date={ this.file.lastModifiedDate }/></dd>

        <dt className="col-2">{t("submission.file.size")}</dt>
        <dd className="col-10">{ filesize(this.file.size, { standard: "iec" }) }</dd>
      </dl>
    );
  }
}

export default translateComponent(FileView);