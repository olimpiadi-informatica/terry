import { Trans } from "@lingui/macro";
import React from "react";
import { NavLink } from "react-router-dom";
import { usePack } from "src/admin/hooks/usePack";
import classNames from "classnames";

export function ExtraSections() {
  const pack = usePack().valueOr(null);
  if (!pack) return null;
  if (!pack.uploaded) return null;
  if (!pack.sections) return null;
  if (pack.sections.length === 0) return null;

  return (
    <>
      <li className="nav-item title mt-3">
        <h5 className="text-uppercase">
          <Trans>Extra material</Trans>
        </h5>
      </li>

      <li className="nav-item">
        {
          pack.sections.map((section) => (
            <NavLink key={section.url} to={`/sections/${section.url}`} className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}>
              {section.name}
            </NavLink>
          ))
        }
      </li>
    </>
  );
}
