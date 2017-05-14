import React, { Component } from 'react';
import filesize from 'filesize';
import DateView from './DateView';

class FileView extends Component {
  constructor(props) {
    super(props);

    this.file = props.file;
  }

  render() {
    return (
      <dl className="file-view row">
        <dt className="col-2">File:</dt>
        <dd className="col-10">{ this.file.name }</dd>

        <dt className="col-2">Last update:</dt>
        <dd className="col-10"><DateView date={ this.file.lastModifiedDate }/></dd>

        <dt className="col-2">Size:</dt>
        <dd className="col-10">{ filesize(this.file.size, { standard: "iec" }) }</dd>
      </dl>
    );
  }
}

export default FileView;
