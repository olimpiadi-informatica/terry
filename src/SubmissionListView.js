import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import Modal from 'react-bootstrap/lib/Modal';
import { Link } from 'react-router-dom';

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

  renderBody() {
    if(this.list.isLoading()) return <p>Loading...</p>;
    if(!this.list.isLoaded()) return <p>Loading submission list failed, reload page.</p>;

    const data = this.list.data;

    return <p>submissions...</p>
  }

  render() {
    return (
      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Submissions for task <strong>{ this.taskName }</strong></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { this.renderBody() }
        </Modal.Body>
        <Modal.Footer>
          <Link to={"/" + this.taskName} role="button" className="btn btn-primary">
            <span aria-hidden="true" className="fa fa-times"></span> Close
          </Link>
        </Modal.Footer>
      </Modal.Dialog>
    );
  }
}

export default SubmissionListView;
