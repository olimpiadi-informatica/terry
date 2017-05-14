import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import { Link } from 'react-router-dom';
import DateView from './DateView';
import client from './TerryClient';
import ModalView from './ModalView';

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
              <a role="button" className="btn btn-secondary"
                               title={submission.input.basename}
                               href={client.filesBaseURI + submission.input.path}
                               download>
                <span aria-hidden="true" className="fa fa-download"></span> Input file
              </a>
              <a role="button" className="btn btn-secondary"
                               title={submission.source.basename}
                               href={client.filesBaseURI + submission.source.path}
                               download>
                <span aria-hidden="true" className="fa fa-download"></span> Source file
              </a>
              <a role="button" className="btn btn-secondary"
                               title={submission.output.basename}
                               href={client.filesBaseURI + submission.output.path}
                               download>
                <span aria-hidden="true" className="fa fa-download"></span> Output file
              </a>
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
      <ModalView contentLabel="Task submissions">
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
      </ModalView>
    );
  }
}

export default SubmissionListView;
