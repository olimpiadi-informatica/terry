import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import { Link } from 'react-router-dom';
import moment from 'moment';

import Modal from 'react-modal';

class SubmissionListView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    this.list = this.model.getTaskState(this.taskName).getSubmissionList();
    this.customStyle = {
      overlay : {
        position          : 'fixed',
        top               : 0,
        left              : 0,
        right             : 0,
        bottom            : 0,
        backgroundColor   : 'rgba(42, 42, 42, 0.75)'
      },
      content : {
        position                   : 'absolute',
        top                        : '10%',
        left                       : '15%',
        right                      : '15%',
        bottom                     : '10%',
        border                     : '1px solid #ccc',
        background                 : '#fff',
        overflow                   : 'auto',
        WebkitOverflowScrolling    : 'touch',
        borderRadius               : '4px',
        outline                    : 'none',
        padding                    : '0px'
      }
    };
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
      <Modal isOpen={true} contentLabel="Modal" style={this.customStyle}>
        <div className="modal-header">
          <h5 className="modal-title">
            Submissions for task <strong>{ this.taskName }</strong>
          </h5>
        </div>
        <div className="modal-body no-padding">
          { this.renderBody() }
        </div>
        <div className="modal-footer">
          <Link to={"/" + this.taskName} role="button" className="btn btn-primary">
            <span aria-hidden="true" className="fa fa-times"></span> Close
          </Link>
        </div>
      </Modal>
    );
  }
}

export default SubmissionListView;
