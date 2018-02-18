
import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus'
import faDownload from '@fortawesome/fontawesome-free-solid/faDownload'
import faUpload from '@fortawesome/fontawesome-free-solid/faUpload'
import CreateSubmissionView from './CreateSubmissionView';
import SubmissionListView from './SubmissionListView';
import SubmissionReportView from './SubmissionReportView';
import client from './TerryClient';
import DateView from './DateView';
import { DateTime } from 'luxon';
import {translateComponent} from "./utils";

import ReactMarkdown from 'react-markdown';
import 'katex-all/dist/katex.min.css';
import katex from 'katex-all/dist/katex.min.js';
import renderMathInElement from 'katex-all/dist/contrib/auto-render.min.js';
import PromiseView from './PromiseView';

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
    const { t } = this.props;
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
