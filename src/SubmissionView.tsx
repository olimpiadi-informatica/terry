import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faTrash, faPaperPlane } from '@fortawesome/fontawesome-free-solid'
import ValidationView from './ValidationView';
import FileView from './FileView';
import ModalView from './ModalView';
import "./SubmissionView.css";
import PromiseView from './PromiseView';
import { InjectedTranslateProps, InjectedI18nProps } from 'react-i18next';
import { Submission } from './user.models';

type Props = {
  submission: Submission
} & InjectedTranslateProps & InjectedI18nProps & RouteComponentProps<any>

export default class SubmissionView extends React.Component<Props> {
  componentDidMount() {
    this.props.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.submission.popObserver(this);
  }

  renderSourceAlert(alert: any, i: number) {
    return (
      <div key={i} className={"alert alert-" + alert.severity}>
        {alert.message}
      </div>
    );
  }

  renderSourceSelector() {
    const { t } = this.props;
    if (!this.props.submission.source) {
      return (
        <div key="absent" className="custom-file mb-3 col-4">
          <input ref="source" name="source" type="file" id="source-file" className="custom-file-input" onChange={(_e) => this.props.submission.setSource((this.refs.source as any).files[0])} />
          <label className="custom-file-label" htmlFor="source-file">File sorgente...</label>
        </div>
      );
    } else {
      const source = this.props.submission.source;
      return (
        <div key="present" className="card card-outline-primary w-100 mb-3">
          <div className="card-header terry-submission-object-card">
            <h5 className="modal-subtitle">{t("submission.submit.source info")}</h5>
            <button key="present" className="terry-submission-object-drop btn btn-primary" onClick={() => this.props.submission.resetSource()}>
              <FontAwesomeIcon icon={faTrash} /> {t("submission.submit.change source")}
            </button>
          </div>
          <div className="card-body">
            <FileView {...this.props} file={source.file} />
            <PromiseView promise={this.props.submission.source.uploadPromise}
              renderFulfilled={(uploadedSource) => <React.Fragment>
                {uploadedSource.data.validation.alerts.map((a: any, i: number) => this.renderSourceAlert(a, i))}
              </React.Fragment>}
              renderRejected={() => <p>{t("error")}</p>}
              renderPending={() => <p>{t("submission.submit.processing")}</p>}
            />
          </div>
        </div>
      );
    }
  }

  renderOutputSelector() {
    const { t } = this.props;
    if (!this.props.submission.output) {
      return (
        <div key="absent" className="custom-file col-4">
          <input ref="output" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.props.submission.setOutput((this.refs.output as any).files[0])} />
          <label className="custom-file-label" htmlFor="output-file">File di output...</label>
        </div>
      );
    } else {
      const output = this.props.submission.output;
      return (
        <div key="present" className="card card-outline-primary w-100">
          <div className="card-header terry-submission-object-card">
            <h5 className="modal-subtitle">{t("submission.submit.output info")}</h5>
            <button key="present" className="btn btn-primary terry-submission-object-drop" onClick={() => this.props.submission.resetOutput()}>
              <FontAwesomeIcon icon={faTrash} /> {t("submission.submit.change output")}
            </button>
          </div>
          <div className="card-body">
            <FileView {...this.props} file={output.file} />
            <PromiseView promise={this.props.submission.output.uploadPromise}
              renderFulfilled={(uploadedOutput) => <ValidationView {...this.props} result={uploadedOutput.data.validation} />}
              renderRejected={() => <p>{t("error")}</p>}
              renderPending={() => <p>{t("submission.submit.processing")}</p>}
            />
          </div>
        </div>
      );
    }
  }

  submit() {
    return this.props.submission.submit().delegate.then((submission: any) => {
      console.error(submission);
      const taskName = submission.data.task;
      const id = submission.data.id;
      this.props.history.push("/task/" + taskName + "/submission/" + id);
    });
  }

  render() {
    const { t } = this.props;
    return (
      <ModalView contentLabel="Submission creation" returnUrl={"/" + this.props.submission.input.task}>
        <form
          className="submissionForm" ref="form" onSubmit={(e) => { e.preventDefault(); this.submit() }}
        // FIXME: after typescript switch, the following was shown to be wrong
        // disabled={!this.props.submission.canSubmit()}
        >
          <div className="modal-header">
            <h5 className="modal-title">
              {t("submission.submit.title")} <strong>{this.props.submission.input.id.slice(0, 6)}</strong>
            </h5>
            <Link to={"/task/" + this.props.submission.input.task} role="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </Link>
          </div>
          <div className="modal-body">
            <div className="input-group">{this.renderSourceSelector()}</div>
            <div className="input-group">{this.renderOutputSelector()}</div>
          </div>
          <div className="modal-footer">
            {this.props.submission.isSubmitted() ? t("submission.submit.processing") : null}
            <Link to={"/task/" + this.props.submission.input.task} role="button" className="btn btn-danger">
              <FontAwesomeIcon icon={faTimes} /> {t("cancel")}
            </Link>
            <button type="submit" className="btn btn-success" disabled={!this.props.submission.canSubmit()}>
              <FontAwesomeIcon icon={faPaperPlane} /> {t("submission.submit.submit")}
            </button>
          </div>
        </form>
      </ModalView>
    );
  }
}
