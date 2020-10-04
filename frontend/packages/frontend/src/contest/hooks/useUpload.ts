import { useState, useMemo } from "react";
import { Loadable } from "@terry/shared/_/Loadable";
import { client } from "@terry/shared/_/TerryClient";

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
