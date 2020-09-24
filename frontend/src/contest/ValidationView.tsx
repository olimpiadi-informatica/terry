import * as React from "react";
import ResultView from "./ResultView";
import { TestCase } from "../domain";
import { Select } from "@lingui/macro";

type Props = {
  result: any;
};

export default class ValidationView extends React.Component<Props> {
  render() {
    const ops = {
      renderCase: (c: TestCase, id: number) => this.renderCase(c, id),
      renderCaseSummary: (c: TestCase, id: number) => this.renderCaseSummary(c, id),
    };
    return <ResultView {...this.props} {...ops} />;
  }

  getColor(c: TestCase) {
    return c.status === "parsed" ? "info" : c.status === "missing" ? "secondary" : "danger";
  }

  renderCaseSummary(c: TestCase, id: number) {
    return (
      <a href={"#case-" + id} className={"badge badge-" + this.getColor(c)}>
        {id}
      </a>
    );
  }

  renderCase(c: TestCase, id: number) {
    return (
      <li id={"case-" + id} key={id} className={"list-group-item list-group-item-" + this.getColor(c)}>
        <span>
          Case #<samp>{id}</samp>:{" "}
          <b>
            <Select value={c.status} parsed="parsed" missing="missing" invalid="invalid" other="?" />
          </b>
          <br />
          <em>{c.message}</em>
        </span>
      </li>
    );
  }
}
