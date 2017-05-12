import React, { Component } from 'react';
import moment from "moment";

class FileView extends Component {
  constructor(props) {
    super(props);

    this.file = props.file;
  }

  render() {
    return (
      <div className="fileView">
        <div><b>File</b>: {this.file.name}</div>
        <div><b>Last Update</b>: {moment(this.file.lastModifiedDate.toString()).startOf('hour').fromNow()}</div>
        <div><b>Size</b>: {this.file.size}</div>
      </div>
    );
  }
}

export default FileView;
