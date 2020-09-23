import * as React from "react";
import ObservablePromise from "./ObservablePromise";

type Props = {
  promise: ObservablePromise;
  renderPending: () => React.ReactNode;
  renderFulfilled: (value: any) => React.ReactNode;
  renderRejected: (error: any) => React.ReactNode;
};

class PromiseView extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    if (!props.renderFulfilled || !props.renderPending || !props.renderRejected) throw Error();
  }

  // FIXME: promise should always be present, check and fix!

  componentDidMount() {
    this.props.promise && this.props.promise.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.promise && this.props.promise.popObserver(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.promise !== this.props.promise) {
      this.props.promise && this.props.promise.popObserver(this);
      newProps.promise && newProps.promise.pushObserver(this);
    }
  }

  render() {
    if (!this.props.promise) return null;

    if (this.props.promise.isPending()) return this.props.renderPending();
    if (this.props.promise.isFulfilled()) return this.props.renderFulfilled(this.props.promise.value);
    if (this.props.promise.isRejected()) return this.props.renderRejected(this.props.promise.error);

    return null;
  }
}

export default PromiseView;
