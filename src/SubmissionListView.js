import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';

class SubmissionListView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    this.list = this.model.getTaskState(this.taskName).getSubmissionList();
  }

  componentWillMount() {
    this.list.load();
  }

  componentDidMount() {
    this.list.pushObserver(this);
  }

  componentWillUnmount() {
    this.list.popObserver(this);
  }

  render() {
    if(this.list.isLoading()) return <p>Loading...</p>;
    if(!this.list.isLoaded()) return <p>Loading submission list failed, reload page.</p>;

    const data = this.list.data;

    return (
      <ul>
        <li>Example submission 1</li>
      </ul>
    );
  }
}

export default SubmissionListView;
