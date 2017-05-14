import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import { Link } from 'react-router-dom';
import DateView from './DateView';

import Modal from 'react-modal';

class SubmissionListView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;
    this.list = this.model.getTaskState(this.taskName).getSubmissionList();

    this.modalStyle = {
      overlay : {
        position          : 'fixed',
        top               : 0,
        left              : 0,
        right             : 0,
        bottom            : 0,
        backgroundColor   : 'rgba(42, 42, 42, 0.75)',
        overflowY         : 'auto',
      },
      content : {
        position                   : 'relative',
        top                        : 'inherit',
        left                       : 'inherit',
        right                      : 'inherit',
        bottom                     : 'inherit',
        margin                     : '3rem auto',
        maxWidth                   : '70%',
        border                     : '1px solid #ccc',
        background                 : '#fff',
        overflow                   : 'auto',
        WebkitOverflowScrolling    : 'touch',
        borderRadius               : '4px',
        outline                    : 'none',
        padding                    : '0px',
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

  getScoreSeverity(score) {
    if (score < 0.01) {
      return "danger";
    } else if (score > 99.99) {
      return "success";
    } else {
      return "warning";
    }
  }

  renderSubmissionList() {
    const submissionList = [];

    console.log(this.list.data.items);

    for (let submission of this.list.data.items) {
      /** FIXME **/
      // the "basename" property should probably be already provided!!!
      let cut = (s) => s.slice(s.lastIndexOf("/") + 1);
      submission.input.basename = cut(submission.input.path);
      submission.output.basename = cut(submission.output.path);
      submission.source.basename = cut(submission.source.path);
      /** FIXME **/

      // FIXME: Here we use "unshift" which means "push_front", maybe it would
      // FIXME: be better to just provide us with correctly ordered data?
      submissionList.unshift(
        <tr key={ submission.id }>
          <td>
            <DateView date={ submission.output.date }/>
          </td>
          <td>
            <div className="btn-group" role="group" aria-label="Download submission data">
              <button role="button" type="button" className="btn btn-secondary" title={submission.input.basename}>
                <span aria-hidden="true" className="fa fa-download"></span> Input file
              </button>
              <button role="button" type="button" className="btn btn-secondary" title={submission.output.basename}>
                <span aria-hidden="true" className="fa fa-download"></span> Source file
              </button>
              <button role="button" type="button" className="btn btn-secondary" title={submission.source.basename}>
                <span aria-hidden="true" className="fa fa-download"></span> Output file
              </button>
            </div>
          </td>
          <td className={"alert-" + this.getScoreSeverity(submission.score)}>
            <span style={ {fontSize: "x-large"} }>{ submission.score }</span> / 100
          </td>
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
      <table className="table" style={ {marginBottom: 0} }>
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
      <Modal isOpen={true} contentLabel="Task submissions" style={this.modalStyle}>
        <div className="modal-header">
          <h5 className="modal-title">
            Submissions for task <strong>{ this.taskName }</strong>
          </h5>
          <Link to={"/" + this.taskName} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
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
