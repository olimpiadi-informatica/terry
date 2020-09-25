import * as React from "react";
import filesize from "filesize";
import { DateComponent } from "../datetime.views";
import { DateTime } from "luxon";
import "./FileView.css";
import { Trans } from "@lingui/macro";

type Props = {
  file: File;
};

export default class FileView extends React.Component<Props> {
  render() {
    const { file } = this.props;
    return (
      <table className="terry-file-view">
        <tbody>
          <tr>
            <th>
              <Trans>File:</Trans>
            </th>
            <td>{file.name}</td>
          </tr>
          {file.lastModified ? (
            <tr>
              <th>
                <Trans>Last update:</Trans>
              </th>
              <td>
                <DateComponent
                  {...this.props}
                  clock={() => DateTime.local()}
                  date={DateTime.fromMillis(file.lastModified)}
                />
              </td>
            </tr>
          ) : (
            ""
          )}
          <tr>
            <th>
              <Trans>Size:</Trans>
            </th>
            <td>{filesize(file.size, { standard: "iec" })}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}
