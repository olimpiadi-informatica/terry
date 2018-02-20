
import React, { Component } from 'react';
import client from './TerryClient';
import {translateComponent} from "./utils";

import ReactMarkdown from 'react-markdown';
import 'katex-all/dist/katex.min.css';
import katex from 'katex-all/dist/katex.min.js';
import renderMathInElement from 'katex-all/dist/contrib/auto-render.min.js';

window.katex = katex;

class TaskStatementView extends Component {
   transformUri(url) {
    const taskBaseUri = this.props.task.data.statement_path.match(/.*\//)[0];
    return client.statementsBaseURI + taskBaseUri + url;
  }

  componentDidMount() {
    renderMathInElement(this.refs.statement, {
      delimiters: [
        {left: "$", right: "$", display: false},
        {left: "$$", right: "$$", display: true},
        {left: "\\[", right: "\\]", display: true},
      ]
    });
  }

  render() {
    return <div ref="statement">
      <ReactMarkdown
        source={this.props.source}
        transformImageUri={this.transformUri.bind(this)}
        transformLinkUri={this.transformUri.bind(this)}
      />
    </div>;
  }
}

export default translateComponent(TaskStatementView);
