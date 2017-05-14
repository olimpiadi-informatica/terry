import React, { ReactDOM, Component } from 'react';
import Modal from 'react-modal';

class ModalView extends Component {
  constructor(props) {
    super(props);

    this.modalStyle = {
      overlay : {
        position          : 'fixed',
        top               : 0,
        left              : 0,
        right             : 0,
        bottom            : 0,
        backgroundColor   : 'rgba(42, 42, 42, 0.75)',
        overflowY         : 'auto',
      },
      content : {
        position                   : 'relative',
        top                        : 'inherit',
        left                       : 'inherit',
        right                      : 'inherit',
        bottom                     : 'inherit',
        margin                     : '3rem auto',
        maxWidth                   : '70%',
        border                     : '1px solid #ccc',
        background                 : '#fff',
        overflow                   : 'auto',
        WebkitOverflowScrolling    : 'touch',
        borderRadius               : '4px',
        outline                    : 'none',
        padding                    : '0px',
      }
    };
  }

  render() {
    return (
      <Modal isOpen={ true } contentLabel={ this.props.contentLabel } style={ this.modalStyle }>
        { this.props.children }
      </Modal>
    );
  }
}

export default ModalView;
