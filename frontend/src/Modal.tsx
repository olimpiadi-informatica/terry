import * as React from "react";
import Modal from "react-modal";
import { useHistory } from "react-router-dom";

import "./Modal.css";

type Props = {
  contentLabel: string;
  returnUrl: string;
  children: React.ReactNode;
};

export default function ModalView({ contentLabel, returnUrl, children }: Props) {
  const history = useHistory();

  return (
    <Modal
      isOpen={true}
      contentLabel={contentLabel}
      style={{
        overlay: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(42, 42, 42, 0.75)",
          overflowY: "auto",
        },
        content: {
          position: "relative",
          top: "inherit",
          left: "inherit",
          right: "inherit",
          bottom: "inherit",
          margin: "3rem auto",
          maxWidth: "70%",
          border: "1px solid #ccc",
          background: "#fff",
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: "4px",
          outline: "none",
          padding: "0px",
        },
      }}
      onRequestClose={() => history.push(returnUrl)}
    >
      {children}
    </Modal>
  );
}

Modal.setAppElement("#root");
