import { t, defineMessage } from "@lingui/macro";
import { MessageDescriptor, i18n } from "@lingui/core";
import { toast } from "react-toastify";

export const MAX_SOURCE_SIZE = 100000;

type SourceLanguageType = { [key: string]: MessageDescriptor };

export const ALLOWED_EXTENSIONS: SourceLanguageType = {
  cpp: defineMessage({ message: "C++" }),
  cc: defineMessage({ message: "C++" }),
  cxx: defineMessage({ message: "C++" }),
  "c++": defineMessage({ message: "C++" }),
  c: defineMessage({ message: "C" }),
  cs: defineMessage({ message: "C#" }),
  dart: defineMessage({ message: "Dart" }),
  go: defineMessage({ message: "Go" }),
  html: defineMessage({ message: "Javascript (HTML)" }),
  java: defineMessage({ message: "Java" }),
  js: defineMessage({ message: "Javascript" }),
  kt: defineMessage({ message: "Kotlin" }),
  ts: defineMessage({ message: "Typescript" }),
  php: defineMessage({ message: "PHP" }),
  pas: defineMessage({ message: "Pascal" }),
  pp: defineMessage({ message: "Pascal" }),
  py: defineMessage({ message: "Python" }),
  py2: defineMessage({ message: "Python" }),
  py3: defineMessage({ message: "Python" }),
  sb3: defineMessage({ message: "Scratch" }),
  srs: defineMessage({ message: "Pseudocode" }),
  rb: defineMessage({ message: "Ruby" }),
  rs: defineMessage({ message: "Rust" }),
  vb: defineMessage({ message: "VisualBasic" }),
};

export const FORBIDDEN_EXTENSIONS: SourceLanguageType = {
  exe: defineMessage({ message: "Compiled binary" }),
  o: defineMessage({ message: "Compiled binary" }),
  or: defineMessage({ message: "Compiled binary" }),
  so: defineMessage({ message: "Compiled binary" }),
  obj: defineMessage({ message: "Compiled binary" }),
  a: defineMessage({ message: "Compiled binary" }),
  cbp: defineMessage({ message: "CodeBlocks project" }),
  txt: defineMessage({ message: "Text file" }),
  xml: defineMessage({ message: "XML file" }),
  class: defineMessage({ message: "Compiled Java class" }),
  jar: defineMessage({ message: "Compiled Java binary" }),
  pyo: defineMessage({ message: "Compiled Python object" }),
  pyc: defineMessage({ message: "Compiled Python object" }),
  pyd: defineMessage({ message: "Compiled Python object" }),
  zip: defineMessage({ message: "Compressed archive" }),
  tar: defineMessage({ message: "Compressed archive" }),
  gz: defineMessage({ message: "Compressed archive" }),
  tgz: defineMessage({ message: "Compressed archive" }),
  xz: defineMessage({ message: "Compressed archive" }),
  rar: defineMessage({ message: "Compressed archive" }),
  pdf: defineMessage({ message: "PDF file" }),
  vbproj: defineMessage({ message: "Visual Studio project" }),
  csproj: defineMessage({ message: "Visual Studio project" }),
  sln: defineMessage({ message: "Visual Studio project" }),
  suo: defineMessage({ message: "Visual Studio project" }),
  dev: defineMessage({ message: "Dev-Cpp project" }),
  lpi: defineMessage({ message: "Free Pascal Lazarus project" }),
  lps: defineMessage({ message: "Free Pascal Lazarus session file" }),
  lrs: defineMessage({ message: "Free Pascal Lazarus file" }),
  lrt: defineMessage({ message: "Free Pascal Lazarus file" }),
  lpk: defineMessage({ message: "Free Pascal Lazarus file" }),
  ppu: defineMessage({ message: "Free Pascal Lazarus file" }),
  compiled: defineMessage({ message: "Compiled file" }),
  docx: defineMessage({ message: "Word document" }),
  rtf: defineMessage({ message: "Word document" }),
  odt: defineMessage({ message: "OpenDocument document" }),
  xlsx: defineMessage({ message: "Excel document" }),
  pages: defineMessage({ message: "Pages document" }),
  jpg: defineMessage({ message: "Image" }),
  jpeg: defineMessage({ message: "Image" }),
  svg: defineMessage({ message: "Image" }),
  png: defineMessage({ message: "Image" }),
  webp: defineMessage({ message: "Image" }),
  heic: defineMessage({ message: "Image" }),
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

async function isExecutable(blob: Blob): Promise<boolean> {
  const buffer = await blob.slice(0, 5).arrayBuffer();
  const view = new Uint8Array(buffer);
  // eslint-disable-next-line no-restricted-syntax
  for (const magic of FORBIDDEN_MAGIC_NUMBERS) {
    let valid = true;
    for (let i = 0; i < magic.length && i < view.length; i += 1) {
      if (view[i] !== magic.charCodeAt(i)) {
        valid = false;
        break;
      }
    }
    if (valid) {
      // eslint-disable-next-line no-console
      console.log(
        "Source file detected to be binary file: it starts with",
        magic,
      );
      return Promise.resolve(true);
    }
  }
  return Promise.resolve(false);
}

export async function checkFile(file: File) {
  const name = file.name as string;
  const nameParts = name.split(".");
  const extension = nameParts[nameParts.length - 1];
  const size = file.size as number | undefined;

  if (size !== undefined && size === 0) {
    toast.error(t`You selected an empty file`);
  } else if (size !== undefined && size > MAX_SOURCE_SIZE) {
    toast.error(
      t`The file you selected is too big (${size} bytes > ${MAX_SOURCE_SIZE} bytes)`,
    );
  } else if (nameParts.length < 2) {
    toast.error(t`Select a file with an extension`);
  } else if (extension.includes(" ")) {
    toast.error(t`The extension cannot contain spaces`);
  } else if (extension in FORBIDDEN_EXTENSIONS) {
    toast.error(
      `${t`The file you selected is not allowed, please select the actual source file of your program. The detected file type is`} ${i18n._(
        FORBIDDEN_EXTENSIONS[extension],
      )}`,
    );
  } else if (await isExecutable(file)) {
    toast.error(
      t`The file you selected has been detected as an executable. Please select the corresponding source file instead.`,
    );
  } else {
    return true;
  }
  return false;
}
