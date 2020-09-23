import * as React from "react";
import { TestCase } from "./domain";

type Props = {
  result: any;
  renderCase: (c: TestCase, i: number) => React.ReactNode;
  renderCaseSummary: (c: TestCase, i: number) => any;
};

export default class ResultView extends React.Component<Props> {
  render() {
    return (
      <React.Fragment>
        <ul className="list-unstyled">
          {this.props.result.alerts.map((a: any, i: number) => (
            <li key={i}>
              <div className={"alert alert-" + a.severity} role="alert">
                <samp>{a.code}</samp> <strong>{a.severity.toUpperCase()}</strong>: {a.message}
              </div>
            </li>
          ))}
        </ul>
        <dl className="terry-file-view">
          <dt>Dettagli:</dt>
          <dd>
            <ul className="list-inline mb-0">
              {this.props.result.cases.map((c: TestCase, i: number) => (
                <li className="list-inline-item" key={i}>
                  {this.props.renderCaseSummary(c, i + 1)}
                </li>
              ))}
            </ul>
          </dd>
        </dl>
        <div className="result-detail">
          <ul className="list-group">
            {this.props.result.cases.map((c: TestCase, i: number) => this.props.renderCase(c, i + 1))}
          </ul>
        </div>
      </React.Fragment>
    );
  }
}
