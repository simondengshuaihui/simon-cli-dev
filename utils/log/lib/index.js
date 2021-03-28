'use strict'

const log = require('npmlog')

// log打印等级
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'

// log头
log.heading = 'simon-cli'

log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log
