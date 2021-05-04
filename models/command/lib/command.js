'use strict'

class Command {
  constructor(argv) {
    // console.log('command constructor', argv)
  }
  init() {
    throw new Error('need implement init function')
  }
  exec() {
    throw new Error('need implement exec function')
  }
}

module.exports = Command
