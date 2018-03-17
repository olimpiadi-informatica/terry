import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faDownload from '@fortawesome/fontawesome-free-solid/faDownload'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import { DateView } from './datetime.views';
import { DateTime } from 'luxon';
import client from './TerryClient';
import ModalView from './ModalView';
import ReactTooltip from 'react-tooltip';
import {colorFromScore, translateComponent} from "./utils";
import "./SubmissionListView.css";
import ScoreView from './ScoreView';
import PromiseView from './PromiseView';

class SubmissionListView extends Component {
  getTask() {
    return this.props.userState.getTask(this.props.taskName);
  }

  getListPromise() {
    return this.props.userState.getTaskState(this.props.taskName).submissionListPromise;
  }

  renderSubmissionList(list) {
    const { t } = this.props;
    const submissionList = [];

    for (let submission of list.items) {
      let cut = (s) => s.slice(s.lastIndexOf("/") + 1);
      submission.input.basename = cut(submission.input.path);
      submission.output.basename = cut(submission.output.path);
      submission.source.basename = cut(submission.source.path);

      submissionList.push(
        <tr key={ submission.id }>
          <td>
            <DateView {...this.props} clock={() => this.props.model.serverTime()} date={ DateTime.fromISO(submission.date) }/>
            <br/>
            <Link to={ "/" + submission.task + "/submission/" + submission.id }>
              {t("submission.list.view details")}
            </Link>
          </td>
          <td>
            <ReactTooltip id={"input-" + submission.id} place="top" type="dark" effect="solid">
              { submission.input.basename }
            </ReactTooltip>
            <ReactTooltip id={"source-" + submission.id} place="top" type="dark" effect="solid">
              { submission.source.basename }
            </ReactTooltip>
            <ReactTooltip id={"output-" + submission.id} place="top" type="dark" effect="solid">
              { submission.output.basename }
            </ReactTooltip>

            <div className="btn-group bordered-group" role="group" aria-label="Download submission data">
              <a role="button" className="btn btn-light"
                               aria-label={submission.input.basename}
                               href={client.filesBaseURI + submission.input.path}
                               download
                               data-tip
                               data-for={"input-" + submission.id}>
                <FontAwesomeIcon icon={faDownload}/>
                {' '}
                <span className="hidden-md-down">{t("submission.list.input")}</span>
              </a>

              <a role="button" className="btn btn-light"
                               aria-label={submission.source.basename}
                               href={client.filesBaseURI + submission.source.path}
                               download
                               data-tip
                               data-for={"source-" + submission.id}>
                <FontAwesomeIcon icon={faDownload}/>
                {' '}
                <span className="hidden-md-down">{t("submission.list.source")}</span>
              </a>

              <a role="button" className="btn btn-light"
                               aria-label={submission.output.basename}
                               href={client.filesBaseURI + submission.output.path}
                               download
                               data-tip
                               data-for={"output-" + submission.id}>
                <FontAwesomeIcon icon={faDownload}/>
                {' '}
                <span className="hidden-md-down">{t("submission.list.output")}</span>
              </a>
            </div>
          </td>
          <td className={"alert-" + colorFromScore(submission.score, this.getTask().data.max_score)}>
            <ScoreView score={submission.score} max={this.getTask().data.max_score} size={1} />
          </td>
        </tr>
      );
    }

    return submissionList.reverse();
  }

  renderBody(list) {
    const { t } = this.props;
    if (list.items.length === 0)
      return <div className="modal-body"><em>{t("submission.list.no submissions")}</em></div>;

    return (
      <div className="modal-body no-padding">
        <table className="table terry-table">
          <thead>
            <tr>
              <th>{t("submission.list.date")}</th>
              <th>{t("submission.list.download")}</th>
              <th>{t("submission.list.score")}</th>
            </tr>
          </thead>
          <tbody>
            { this.renderSubmissionList(list) }
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    const taskName = this.props.taskName;
    const { t } = this.props;
    return (
      <ModalView contentLabel={t("submission.list.title")} returnUrl={"/" + this.props.taskName}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t("submission.list.title")} <strong class="text-uppercase">{taskName}</strong>
          </h5>
          <Link to={"/" + this.props.taskName} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <PromiseView
          promise={this.getListPromise()}
          renderPending={() => <div className="modal-body"><em>{t("loading")}</em></div>}
          renderRejected={() => t("error")}
          renderFulfilled={(list) => this.renderBody(list)}
        />
        <div className="modal-footer">
          <Link to={"/" + this.props.taskName} role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes}/> {t("close")}
          </Link>
        </div>
      </ModalView>
    );
  }
}

export default translateComponent(SubmissionListView);
