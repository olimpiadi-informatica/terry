import * as React from "react";
import SubmissionView from "./SubmissionView";
import { WithTranslation } from "react-i18next";
import { RouteComponentProps } from "react-router";

type Props = {
  userState: any;
  taskName: string;
  inputId: string;
} & WithTranslation &
  RouteComponentProps<any>;

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
    const { t } = this.props;
    if (this.submission === undefined) return <p>{t("submission.cannot submit")}</p>;
    return <SubmissionView {...this.props} submission={this.submission} />;
  }
}
