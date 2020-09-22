import { t } from "@lingui/macro";
import { MessageDescriptor } from "@lingui/core";

export const MAX_SOURCE_SIZE = 32 * 1024;

type SourceLanguageType = { [key: string]: MessageDescriptor };

export const ALLOWED_EXTENSIONS: SourceLanguageType = {
  cpp: t`C++`,
  cc: t`C++`,
  cxx: t`C++`,
  "c++": t`C++`,
  c: t`C`,
  cs: t`C#`,
  go: t`Go`,
  java: t`Java`,
  js: t`Javascript`,
  kt: t`Kotlin`,
  ts: t`Typescript`,
  php: t`PHP`,
  pas: t`Pascal`,
  pp: t`Pascal`,
  py: t`Python`,
  py2: t`Python`,
  py3: t`Python`,
  rb: t`Ruby`,
  rs: t`Rust`,
  vb: t`VisualBasic`,
};

export const FORBIDDEN_EXTENSIONS: SourceLanguageType = {
  exe: t`Compiled binary`,
  o: t`Compiled binary`,
  so: t`Compiled binary`,
  obj: t`Compiled binary`,
  a: t`Compiled binary`,
  cbp: t`CodeBlocks project`,
  txt: t`Text file`,
  xml: t`XML file`,
  class: t`Compiled Java class`,
  jar: t`Compiled Java binary`,
  pyo: t`Compiled Python object`,
  pyc: t`Compiled Python object`,
  pyd: t`Compiled Python object`,
  zip: t`Compressed archive`,
  tar: t`Compressed archive`,
  gz: t`Compressed archive`,
  tgz: t`Compressed archive`,
  xz: t`Compressed archive`,
  rar: t`Compressed archive`,
  pdf: t`PDF file`,
  vbproj: t`Visual Studio project`,
  csproj: t`Visual Studio project`,
  sln: t`Visual Studio project`,
  suo: t`Visual Studio project`,
};
