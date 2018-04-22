import * as React from 'react';
import { translateComponent } from "./utils";
import Pack from "./Pack";
import LoadingView from "./LoadingView";
import UploadPackView from "./UploadPackView";
import AdminView from "./AdminView";
import { InjectedTranslateProps, InjectedI18nProps } from 'react-i18next';
import { RouteComponentProps } from 'react-router';

type Props = InjectedTranslateProps & InjectedI18nProps & RouteComponentProps<any>

class PackView extends React.Component<Props> {
  pack: Pack;

  constructor(props: Props) {
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
      return <AdminView {...this.props} pack={this.pack} />;
    } else {
      return <UploadPackView {...this.props} pack={this.pack} />;
    }
  }
}

export default translateComponent(PackView, "admin");
