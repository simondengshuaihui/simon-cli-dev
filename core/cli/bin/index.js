#! /usr/bin/env node

const importLocal = require('import-local')
if (importLocal(__filename)) {
  require('npmlog').info('cli', '使用本地版本')
} else {
  require('../lib')(process.argv.slice(2))
}
