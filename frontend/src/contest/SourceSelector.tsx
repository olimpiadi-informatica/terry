import React, { createRef, useEffect, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { i18n } from "@lingui/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { checkFile, ALLOWED_EXTENSIONS } from "./submissionLimits";
import { FileView } from "./FileView";
import {
  useUpload, UploadType, UploadedFile, Alert,
} from "./hooks/useUpload";
import { ValidationAlert } from "./ValidationAlert";

export type UploadedSource = UploadedFile & {
  validation: {
    alerts: Alert[];
  };
};

type Props = {
  inputId: string;
  setSource: (source: UploadedSource | null) => void;
};

export function SourceSelector({ inputId, setSource }: Props) {
  const sourceRef = createRef<HTMLInputElement>();
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, upload] = useUpload<UploadedSource>(inputId, UploadType.Source);

  useEffect(() => {
    if (!sourceRef.current) return;
    const f = sourceRef.current.files?.[0] || null;
    setFile(f);
    if (uploadStatus.isReady()) setSource(uploadStatus.value());
    else setSource(null);
  }, [uploadStatus, setSource, sourceRef]);

  if (!file) {
    const selectSourceFile = async () => {
      if (!sourceRef.current) return;
      const f = sourceRef.current.files?.[0];
      if (f && (await checkFile(f))) {
        upload(f);
      } else {
        sourceRef.current.value = sourceRef.current.defaultValue;
      }
    };

    return (
      <>
        <div key="absent" className="custom-file mb-3">
          <input
            ref={sourceRef}
            name="source-file"
            type="file"
            id="source-file"
            className="custom-file-input"
            onChange={() => selectSourceFile()}
          />
          <label className="custom-file-label" htmlFor="source-file">
            <Trans>Source file...</Trans>
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

  const { name } = file;
  const nameParts = name.split(".");
  const extension = nameParts[nameParts.length - 1];
  let warn = null;
  let language = null;
  if (extension in ALLOWED_EXTENSIONS) {
    language = i18n._(ALLOWED_EXTENSIONS[extension]);
  } else {
    warn = i18n._(
      t`You selected a file with an unknown extension. This submission may be invalidated if this file is not the true source of the program that generated the output file. If you think you selected the wrong file, please change it before submitting.`,
    );
  }
  return (
    <div key="present" className="card card-outline-primary w-100 mb-3">
      <div className="card-header terry-submission-object-card">
        <h5 className="modal-subtitle">
          <Trans>Source file info</Trans>
        </h5>
        <button
          key="present"
          type="button"
          className="terry-submission-object-drop btn btn-primary"
          onClick={() => {
            setFile(null);
            setSource(null);
          }}
        >
          <FontAwesomeIcon icon={faTrash} />
          {" "}
          <Trans>Change source</Trans>
        </button>
      </div>
      <div className="card-body">
        <FileView file={file} />
        {warn && <div className="alert alert-warning">{warn}</div>}
        {language && (
          <div className="alert alert-primary">
            <Trans>Detected language:</Trans>
            {" "}
            {language}
          </div>
        )}
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
        {uploadStatus.isReady()
          && uploadStatus.value().validation.alerts.map((a) => <ValidationAlert alert={a} key={a.message} />)}
      </div>
    </div>
  );
}
