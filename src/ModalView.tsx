import * as React from 'react';
import Modal from 'react-modal';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import './ModalView.css';

type Props = {
  contentLabel: string
  returnUrl: string
} & RouteComponentProps<any>

class ModalView extends React.Component<Props> {
  modalStyle: any;

  constructor(props: Props) {
    super(props);

    this.modalStyle = {
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(42, 42, 42, 0.75)',
        overflowY: 'auto',
      },
      content: {
        position: 'relative',
        top: 'inherit',
        left: 'inherit',
        right: 'inherit',
        bottom: 'inherit',
        margin: '3rem auto',
        maxWidth: '70%',
        border: '1px solid #ccc',
        background: '#fff',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '4px',
        outline: 'none',
        padding: '0px',
      }
    };
  }

  render() {
    return (
      <Modal isOpen={true} contentLabel={this.props.contentLabel} style={this.modalStyle}
        onRequestClose={() => this.props.history.push(this.props.returnUrl)}>
        {this.props.children}
      </Modal>
    );
  }
}

Modal.setAppElement('#root');

export default withRouter(ModalView);
