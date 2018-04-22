import * as React from 'react';
import client from './TerryClient';

import * as ReactMarkdown from 'react-markdown';
import 'katex-all/dist/katex.min.css';

const katex = require('katex-all/dist/katex.min.js')
const renderMathInElement = require('katex-all/dist/contrib/auto-render.min.js')

type Props = {
  task: any
  source: string
}

export default class TaskStatementView extends React.Component<Props> {
  transformUri(url: string) {
    const taskBaseUri = this.props.task.data.statement_path.match(/.*\//)[0];
    return client.statementsBaseURI + taskBaseUri + url;
  }

  componentDidMount() {
    (window as any).katex = katex;

    renderMathInElement(this.refs.statement, {
      delimiters: [
        { left: "$", right: "$", display: false },
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
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
