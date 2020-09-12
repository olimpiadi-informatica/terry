import * as React from "react";
import filesize from "filesize";
import { DateView } from "./datetime.views";
import { DateTime } from "luxon";
import "./FileView.css";
import { Trans } from "@lingui/macro";

type Props = {
  file: any;
};

export default class FileView extends React.Component<Props> {
  render() {
    return (
      <dl className="terry-file-view">
        <dt><Trans>File:</Trans></dt>
        <dd>{this.props.file.name}</dd>

        <dt><Trans>Last update:</Trans></dt>
        <dd>
          <DateView
            {...this.props}
            clock={() => DateTime.local()}
            date={DateTime.fromJSDate(this.props.file.lastModifiedDate)}
          />
        </dd>

        <dt><Trans>Size:</Trans></dt>
        <dd>{filesize(this.props.file.size, { standard: "iec" })}</dd>
      </dl>
    );
  }
}
