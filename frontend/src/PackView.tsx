import * as React from "react";
import Pack from "./Pack";
import LoadingView from "./LoadingView";
import UploadPackView from "./UploadPackView";
import AdminView from "./AdminView";
import { RouteComponentProps } from "react-router";

type Props = RouteComponentProps<any>;

export default class PackView extends React.Component<Props> {
  pack: Pack | null = null;

  componentDidMount() {
    this.pack = new Pack();
    this.pack.onAppStart();
    this.pack.pushObserver(this);
  }

  componentWillUnmount() {
    this.pack!.popObserver(this);
  }

  render() {
    if (!this.pack || this.pack.isLoading()) return <LoadingView />;
    // FIXME: use a proper ErrorView or similar
    if (!this.pack.isLoaded()) return <p>An error occurred: {this.pack.error.message}</p>;

    if (this.pack.data.uploaded) {
      return <AdminView {...this.props} pack={this.pack} />;
    } else {
      return <UploadPackView {...this.props} pack={this.pack} />;
    }
  }
}
