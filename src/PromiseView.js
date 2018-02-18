import React, { Component } from 'react';
import ObservablePromise from './ObservablePromise';

class PromiseView extends Component {
  constructor(props) {
    super(props);

    if(!(props.promise instanceof ObservablePromise))
      throw new Error("invalid promise given to PromiseView");
  }

  static defaultProps = {
    renderRejected: (error) => {
      // by default the promise is not expected to ever fail
      // consider a rejection as a bug in the code
      throw Error(error);
    },
    renderPending: (error) => <p>Pending...</p>,
  };

  componentDidMount() {
    this.props.promise.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.promise.popObserver(this);
  }

  componentWillReceiveProps(newProps) {
    if(newProps.promise !== this.props.promise) {
      this.props.promise.popObserver(this);
      newProps.promise.pushObserver(this);
    }
  }

  render() {
    if(this.props.promise.isPending()) return this.props.renderPending();
    if(this.props.promise.isFulfilled()) return this.props.renderFulfilled(this.props.promise.value);
    if(this.props.promise.isRejected()) return this.props.renderRejected(this.props.promise.error);
  }
}

export default PromiseView;
