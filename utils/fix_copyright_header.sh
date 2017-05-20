#!/usr/bin/env bash

folder=${1:-$(git rev-parse --show-toplevel)}
TMPFILE=$(mktemp)

echo "==== Working on $folder"
echo "==== Temp file is $TMPFILE"

files=$(grep -ri --exclude-dir=.git --exclude-dir=build --exclude-dir=utils "# Copyright" $folder | cut -d: -f1 | sort | uniq)

for file in $files; do
	echo "==== Processing $file"
	$(git rev-parse --show-toplevel)/utils/fix_copyright_header_file.sh ${file} > $TMPFILE
    cp "$TMPFILE" "$file"
done
