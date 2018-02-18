import React, { Component } from 'react';

class PromiseView extends Component {
  static defaultProps = {
    renderRejected: (error) => <p>An error occurred.</p>,
    renderPending: (error) => <p>Pending...</p>,
  };

  constructor(props) {
    super(props);

    this.state = {
      value: null,
      error: null,
    };
  }

  componentDidMount() {
    this.promise = this.props.promise.then((value) => {
      this.setState({value: value, error: null});
    }).catch((error) => {
      this.setState({value: null, error: error});
    })
  }

  render() {
    if(this.state.error) return this.props.renderRejected(this.state.error);
    if(!this.state.value) return this.props.renderPending();
    return this.props.renderFulfilled(this.state.value);
  }
}

export default PromiseView;
