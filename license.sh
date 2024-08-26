#!/bin/bash

LICENSE="// SPDX-License-Identifier: BUSL-1.1"

for file in $(find . -name '*.rs' -not -path "./**/target/*"); do
  if ! grep -q "$LICENSE" "$file"; then
    echo -e "$LICENSE\n$(cat $file)" > "$file"
    echo "Added license to $file"
  fi
done
