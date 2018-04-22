import * as React from 'react';
import * as filesize from 'filesize';
import { DateView } from './datetime.views';
import { DateTime } from "luxon";
import "./FileView.css";
import { InjectedTranslateProps, InjectedI18nProps } from 'react-i18next';

type Props = {
  file: any
} & InjectedTranslateProps & InjectedI18nProps

export default class FileView extends React.Component<Props> {
  render() {
    const { t } = this.props;
    return (
      <dl className="terry-file-view">
        <dt>{t("submission.file.file")}</dt>
        <dd>{this.props.file.name}</dd>

        <dt>{t("submission.file.last update")}</dt>
        <dd>
          <DateView
            {...this.props}
            clock={() => DateTime.local()}
            date={DateTime.fromJSDate(this.props.file.lastModifiedDate)} />
        </dd>

        <dt>{t("submission.file.size")}</dt>
        <dd>{filesize(this.props.file.size, { standard: "iec" })}</dd>
      </dl>
    );
  }
}