import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import ModalView from './ModalView';
import FeedbackView from './FeedbackView';
import {translateComponent} from "./utils";
import PromiseView from './PromiseView';

class SubmissionReportView extends Component {
  constructor(props) {
    super(props);
    this.submissionPromise = this.props.model.getSubmissionPromise(this.props.submissionId);
  }

  getSubmissionPromise() {
    return this.submissionPromise;
  }

  render() {
    const { t } = this.props;
    const returnUrl = "/" + this.props.taskName;
    return (
      <ModalView contentLabel="Submission creation" returnUrl={returnUrl}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t("submission.feedback.title")} <strong>{ this.props.submissionId }</strong>
          </h5>
          <Link to={returnUrl} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <PromiseView promise={this.getSubmissionPromise()}
          renderFulfilled={(submission) =>
            <React.Fragment>
              <FeedbackView {...this.props} submission={submission} />
              <div className="modal-footer">
                <Link to={returnUrl} role="button" className="btn btn-primary">
                  <FontAwesomeIcon icon={faTimes}/> {t("close")}
                </Link>
              </div>
            </React.Fragment>
          }
          renderPending={() => <div className="modal-body">{t("loading")}</div>}
          renderRejected={() => <div className="modal-body">{t("error")}</div>}
        />
      </ModalView>
    );
  }
}

export default translateComponent(SubmissionReportView);
