import { t } from "@lingui/macro";
import { MessageDescriptor } from "@lingui/core";
import { toast } from "react-toastify";
import { i18n } from "../i18n";

export const MAX_SOURCE_SIZE = 30000;

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

const FORBIDDEN_MAGIC_NUMBERS = [
  "\x4D\x5A", // Windows
  "\xCE\xFA\xED\xFE", // MacOs 32 bit
  "\xCF\xFA\xED\xFE", // MacOs 64 bit
  "\xBE\xBA\xFE\xCA", // MacOs 32 bit FAT
  "\xBF\xBA\xFE\xCA", // MacOs 64 bit FAT
  "\x7F\x45\x4C\x46\x01", // ELF 32 bit
  "\x7F\x45\x4C\x46\x02", // ELF 64 bit
];

export async function checkFile(file: File) {
  const name = file.name as string;
  const nameParts = name.split(".");
  const extension = nameParts[nameParts.length - 1];
  const size = file.size as number | undefined;

  if (size !== undefined && size === 0) {
    toast.error(i18n._(t`You selected an empty file`));
  } else if (size !== undefined && size > MAX_SOURCE_SIZE) {
    toast.error(i18n._(t`The file you selected is too big (${size} bytes > ${MAX_SOURCE_SIZE} bytes)`));
  } else if (nameParts.length < 2) {
    toast.error(i18n._(t`Select a file with an extension`));
  } else if (extension.includes(" ")) {
    toast.error(i18n._(t`The extension cannot contain spaces`));
  } else if (extension in FORBIDDEN_EXTENSIONS) {
    toast.error(
      `${i18n._(
        t`The file you selected is not allowed, please select the actual source file of your program. The detected file type is`,
      )
      } ${
        i18n._(FORBIDDEN_EXTENSIONS[extension])}`,
    );
  } else if (await isExecutable(file)) {
    toast.error(
      i18n._(
        t`The file you selected has been detected as an executable. Please select the corresponding source file instead.`,
      ),
    );
  } else {
    return true;
  }
  return false;
}

async function isExecutable(blob: Blob): Promise<boolean> {
  const buffer = await blob.slice(0, 5).arrayBuffer();
  const view = new Uint8Array(buffer);
  for (const magic of FORBIDDEN_MAGIC_NUMBERS) {
    let valid = true;
    for (let i = 0; i < magic.length && i < view.length; i++) {
      if (view[i] !== magic.charCodeAt(i)) {
        valid = false;
        break;
      }
    }
    if (valid) {
      console.log("Source file detected to be binary file: it starts with", magic);
      return Promise.resolve(true);
    }
  }
  return Promise.resolve(false);
}
