import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Trans } from "@lingui/macro";
import SubmissionView from "./SubmissionView";

type Props = {
  userState: any;
  taskName: string;
  inputId: string;
} & RouteComponentProps<any>;

export default class CreateSubmissionView extends React.Component<Props> {
  submission: any;

  constructor(props: Props) {
    super(props);

    if (this.getTaskState().canSubmit(this.props.inputId)) {
      this.submission = this.getTaskState().createSubmission(this.props.inputId);
    }
  }

  getTaskState() {
    return this.props.userState.getTaskState(this.props.taskName);
  }

  render() {
    if (this.submission === undefined) {
      return (
        <p>
          <Trans>Cannot submit for this input.</Trans>
        </p>
      );
    }
    return <SubmissionView {...this.props} submission={this.submission} />;
  }
}
