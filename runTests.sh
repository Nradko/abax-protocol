#!/bin/bash
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
$SCRIPT_DIR/updateTestDbBackup.sh
UPDATE_DB_RESULT=$?
if [ $UPDATE_DB_RESULT -ne 0 ]; then
    exit 1
fi
rm $SCRIPT_DIR/*.testrun*.log


export NODE_OPTIONS=$NODE_OPTIONS" --max-old-space-size=16384"
start_time=$(date +%s.%3N)
script -efq $SCRIPT_DIR/mocha.testrun.log -c \
"env CARGO_TERM_COLOR=always FORCE_COLOR=1 npx tsx $SCRIPT_DIR/runWithoutWarnings.ts npx mocha --node-option max-old-space-size=16384 --config ./.mocharc.js -C --exit --full-trace false --require tsx/cjs --require 'tests/setup/globalHooks.ts' 'tests/**/*.ts' --colors"

end_time=$(date +%s.%3N)
elapsed=$(echo "scale=3; $end_time - $start_time" | bc)
echo "Test execution took $elapsed seconds"
npx tsx $SCRIPT_DIR/scripts/fixupNodeLog.ts $SCRIPT_DIR/substrate-contracts-node.testrun.log
