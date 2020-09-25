import React, { createRef } from "react";
import { Trans, t } from "@lingui/macro";
import { i18n } from "../i18n";
import { useActions } from "./AdminContext";

export default function UploadPackView() {
  const inputRef = createRef<HTMLInputElement>();
  const { uploadPack } = useActions();

  const doUpload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    uploadPack(file);
  };

  return (
    <div className="jumbotron admin-jumbotron">
      <h1 className="text-center display-3">
        <Trans>Admin</Trans>
      </h1>
      <hr />
      <h2 className="text-center">
        <Trans>Please select the contest file...</Trans>
      </h2>
      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          doUpload();
        }}
      >
        <div className="form-group">
          <label htmlFor="file" className="sr-only">
            <Trans>File</Trans>
          </label>
          <input type="file" accept=".enc" name="file" id="file" ref={inputRef} className="form-control" required />
        </div>
        <input type="submit" className="btn btn-danger" value={i18n._(t`Upload`)} />
      </form>
    </div>
  );
}
