import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';

class SubmissionListView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    this.list = this.model.getSubmissionList(this.taskName);
    this.list.load().then(() => this.forceUpdate());
  }

  render() {
    if(!this.list.isLoaded()) return <p>Loading...</p>

    const data = this.list.getData();
    console.log(data);
    return (
      <ul>
        <li>TODO: items!</li>
      </ul>
    );
  }
}

export default SubmissionListView;
