## Useful commands:

1. Allow to allocate more memory for node:
   `echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc`
2. Run test scenario file in debug (targetting persistent local node):
   `npm run test:debug <test_scenario_file_name>`
3. Run all tests (will kill existing processes listening on port 9944 that is required for tests):
   `npm run test`
4. Run node, run deployment and update test db (required to run `npm run test` after contract's code change):
   `./updateTestDbBackup.sh`
