#!/usr/bin/env bash

read -r -d '' STATIC_HEADER << EOF
#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
EOF

file=$1

authors=$(git log --pretty=format:"# Copyright €€€€ - %an <%ae> € %cI" ${file} | sed -r 's/€€€€ (.+) € (....).+/\2 \1/' | sort | uniq)
lines=$(grep -in "# Copyright" "$file" | sort | cut -d: -f1 | tail -n1)
lines=$(($lines + 1))
echo -e "$STATIC_HEADER"
echo "$authors"
cat $file | tail -n +${lines}
