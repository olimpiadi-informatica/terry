import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import Modal from 'react-bootstrap/lib/Modal';
import { Link } from 'react-router-dom';
import moment from 'moment';

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

  renderSubmissionList() {
    const submissionList = [];

    console.log(this.list.data.items);

    for (let submission of this.list.data.items) {
      submissionList.push(
        <tr key={ submission.id }>
          <td>{ moment(submission.output.date.toString()).startOf('hour').fromNow() }</td>
          <td>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button role="button" type="button" className="btn btn-secondary">

                Input file
              </button>
              <button role="button" type="button" className="btn btn-secondary">
                Source file
              </button>
              <button role="button" type="button" className="btn btn-secondary">
                Output file
              </button>
            </div>
          </td>
          <td>{ submission.score } / 100.0</td>
          <td>
            <button role="button" type="button" className="btn btn-secondary">
              Details
            </button>
          </td>
        </tr>
      );
    }

    return submissionList;
  }

  renderBody() {
    if(this.list.isLoading()) return <p>Loading...</p>;
    if(!this.list.isLoaded()) return <p>Loading submission list failed, reload page.</p>;

    return (
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Download</th>
            <th>Score</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          { this.renderSubmissionList() }
        </tbody>
      </table>
    );
  }

  render() {
    return (
      <Modal.Dialog bsSize="large">
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
