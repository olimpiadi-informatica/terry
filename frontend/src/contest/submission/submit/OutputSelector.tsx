import React, { createRef, useEffect, useState } from "react";
import { Trans } from "@lingui/macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useUpload, UploadType } from "src/contest/hooks/useUpload";
import { ValidationView } from "src/contest/submission/ValidationView";
import { UploadedOutput } from "src/types/contest";
import { FileView } from "./FileView";

type Props = {
  inputId: string;
  setOutput: (output: UploadedOutput | null) => void;
};

export function OutputSelector({ inputId, setOutput }: Props) {
  const outputRef = createRef<HTMLInputElement>();
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, upload] = useUpload<UploadedOutput>(inputId, UploadType.Output);

  useEffect(() => {
    if (!outputRef.current) return;
    const f = outputRef.current.files?.[0] || null;
    setFile(f);
    if (uploadStatus.isReady()) setOutput(uploadStatus.value());
    else setOutput(null);
  }, [uploadStatus, setOutput, outputRef]);

  if (!file) {
    const selectOutputFile = async () => {
      if (!outputRef.current) return;
      const f = outputRef.current.files?.[0] || null;
      upload(f);
    };

    return (
      <>
        <div key="absent" className="custom-file mb-3">
          <input
            ref={outputRef}
            name="output-file"
            type="file"
            id="output-file"
            className="custom-file-input"
            onChange={() => selectOutputFile()}
          />
          <label className="custom-file-label" htmlFor="output-file">
            <Trans>Output file...</Trans>
          </label>
        </div>
        {uploadStatus.isError() && (
          <p>
            <Trans>Error</Trans>
          </p>
        )}
      </>
    );
  }

  return (
    <div key="present" className="card card-outline-primary w-100 mb-3">
      <div className="card-header terry-submission-object-card">
        <h5 className="modal-subtitle">
          <Trans>Output file info</Trans>
        </h5>
        <button
          key="present"
          type="button"
          className="terry-submission-object-drop btn btn-primary"
          onClick={() => {
            setFile(null);
            setOutput(null);
          }}
        >
          <FontAwesomeIcon icon={faTrash} />
          {" "}
          <Trans>Change output</Trans>
        </button>
      </div>
      <div className="card-body">
        <FileView file={file} />
        {uploadStatus.isLoading() && (
          <p>
            <Trans>Processing...</Trans>
          </p>
        )}
        {uploadStatus.isError() && (
          <p>
            <Trans>Error</Trans>
          </p>
        )}
        {uploadStatus.isReady() && <ValidationView output={uploadStatus.value()} />}
      </div>
    </div>
  );
}
