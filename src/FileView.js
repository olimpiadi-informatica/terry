import React, { Component } from 'react';
import moment from "moment";
import filesize from 'filesize';

class FileView extends Component {
  constructor(props) {
    super(props);

    this.file = props.file;
  }

  render() {
    return (
      <dl className="file-view">
        <dt>File</dt>
        <dd>{ this.file.name }</dd>

        <dt>Last update</dt>
        <dd>{ moment(this.file.lastModifiedDate.toString()).startOf('hour').fromNow() }</dd>

        <dt>Size</dt>
        <dd>{ filesize(this.file.size, { standard: "iec" }) }</dd>
      </dl>
    );
  }
}

export default FileView;
