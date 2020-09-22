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
      <table className="terry-file-view">
        <tbody>
          <tr>
            <th>
              <Trans>File:</Trans>
            </th>
            <td>{this.props.file.name}</td>
          </tr>
          <tr>
            <th>
              <Trans>Last update:</Trans>
            </th>
            <td>
              <DateView
                {...this.props}
                clock={() => DateTime.local()}
                date={DateTime.fromJSDate(this.props.file.lastModifiedDate)}
              />
            </td>
          </tr>
          <tr>
            <th>
              <Trans>Size:</Trans>
            </th>
            <td>{filesize(this.props.file.size, { standard: "iec" })}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}
