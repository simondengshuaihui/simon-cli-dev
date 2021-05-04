'use strict'
const Command = require('@simon-cli-dev/command')
const semver = require('semver')
const colors = require('colors')
const log = require('@simon-cli-dev/log')
const { isObject } = require('@simon-cli-dev/utils')

const LOWEST_NODE_VERSION = '12.0.0'

class InitCommand extends Command {
  constructor(argv) {
    super()
    if (!argv) {
      throw new Error('Command参数不能为空')
    }
    if (!Array.isArray(argv)) {
      throw new Error('Command参数必须为数组')
    }
    if (!argv.length) {
      throw new Error('Command参数为空')
    }
    console.log(argv)
    this._argv = argv
    this.initArgs()
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs())
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      chain.catch((err) => {
        log.error(err.message)
      })
    })
  }

  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName:', this.projectName)
    log.verbose('force:', this.force)
  }

  exec() {}

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }

  checkNodeVersion() {
    const currentVersion = process.version
    log.info('node version', currentVersion)
    if (!semver.gt(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(
        colors.red(`cli 需要安装 node v ${LOWEST_NODE_VERSION} 以上版本`)
      )
    }
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
