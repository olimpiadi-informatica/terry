import { useState, useMemo } from "react";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";

export type UploadedFile = {
  date: string;
  id: string;
  input: string;
  path: string;
  size: number;
};

export type Alert = {
  message: string;
  severity: "warning" | "danger" | "success";
  code?: string;
};

export enum UploadType {
  Source,
  Output,
}

export function useUpload<T>(inputId: string, type: UploadType) {
  const [upload, setUpload] = useState<Loadable<T>>(Loadable.loading());

  const doUpload = useMemo(
    () => (file: File | null) => {
      if (!file) return;
      const data = new FormData();

      data.append("input_id", inputId);
      data.append("file", file);

      client.api
        .post(type === UploadType.Source ? "/upload_source" : "/upload_output", data)
        .then((response) => {
          setUpload(Loadable.of(response.data));
        })
        .catch((response) => {
          setUpload(Loadable.error(response));
        });
    },
    [inputId, type],
  );

  return [upload, doUpload] as const;
}
