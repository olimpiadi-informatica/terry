import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import {translateComponent} from "./utils";
import Pack from "./Pack";
import LoadingView from "./LoadingView";
import UploadPackView from "./UploadPackView";
import AdminView from "./AdminView";

class PackView extends Component {
  constructor(props) {
    super(props);
    this.pack = new Pack();
  }

  componentWillMount() {
    this.pack.onAppStart();
  }

  componentDidMount() {
    this.pack.pushObserver(this);
  }

  componentWillUnmount() {
    this.pack.popObserver(this);
  }

  render() {
    if (this.pack.isLoading()) return <LoadingView />;
    // FIXME: use a proper ErrorView or similar
    if (!this.pack.isLoaded()) return <p>An error occurred: {this.pack.error.message}</p>;

    if (this.pack.data.uploaded) {
      return <AdminView />;
    } else {
      return <UploadPackView pack={this.pack} />;
    }
  }
}

export default translateComponent(PackView, "admin");
