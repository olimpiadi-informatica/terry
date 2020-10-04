import React from "react";

// eslint-disable-next-line import/no-extraneous-dependencies
import "@terry/shared/src/components/Loading.css";

export function Loading() {
  return (
    <div className="sk-folding-cube">
      <div className="sk-cube1 sk-cube" />
      <div className="sk-cube2 sk-cube" />
      <div className="sk-cube4 sk-cube" />
      <div className="sk-cube3 sk-cube" />
    </div>
  );
}
