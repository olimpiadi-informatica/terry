import React, { Component } from 'react';
import moment from "moment";

class FileView extends Component {
  constructor(props) {
    super(props);

    this.file = props.file;
  }

  render() {
    return (
      <div>
        <p>File: {this.file.name}</p>
        <p>Last Update: {moment(this.file.lastModifiedDate.toString()).startOf('hour').fromNow()}</p>
        <p>Size: {this.file.size}</p>
      </div>
    );
  }
}

export default FileView;
