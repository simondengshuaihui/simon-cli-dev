'use strict'

module.exports = core

const colors = require('colors')
const semver = require('semver')
const userHome = require('user-home')
const minimist = require('minimist')
const pathExists = require('path-exists').sync
const path = require('path')
const pkg = require('../package.json')
const log = require('@simon-cli-dev/log')
const constant = require('./constant')

async function core(argv) {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobleUpdate()
  } catch (e) {
    log.error(e.message)
  }
}

async function checkGlobleUpdate() {
  // 获取版本号和包名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 调用npm获取npm包信息
  const { getNpmSemverVersion } = require('@simon-cli-dev/get-npm-info')
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动跟新最新版本:${lastVersion}, 当前版本:${currentVersion}
    更新命令：npm install -g ${npmName}
    `)
    )
  }
}

function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    // 把.env的配置添加到环境变量中
    dotenv.config({
      path: dotenvPath,
    })
  }
  createDefaultConfig()
  log.verbose(process.env.CLI_HOME)
}

function createDefaultConfig() {
  if (process.env.CLI_HOME) {
    process.env.CLI_HOME = path.join(userHome, constant.CLI_HOME)
  } else {
    process.env.CLI_HOME = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
}

function checkInputArgs() {
  const args = minimist(process.argv.slice(2))
  checkArgs(args)
}

function checkArgs(args) {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}
function checkUserHome() {
  // 检查用户主目录，为以后缓存文件
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('登录用户主目录不存在'))
  }
}

function checkRoot() {
  // 降级root用户启动
  const rootCheck = require('root-check')
  rootCheck()
  // log.info(process.geteuid()) // 501为普通用户 0为root用户
}

function checkPkgVersion() {
  log.notice('cli', pkg.version)
}
function checkNodeVersion() {
  const currentVersion = process.version
  log.info('node version', currentVersion)
  if (!semver.gt(currentVersion, constant.LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(`cli 需要安装 node v ${constant.LOWEST_NODE_VERSION} 以上版本`)
    )
  }
}

// 检查版本号
// 检查node版本号
// 检查root启动，降级为普通用户
// 检查用户主目录，缓存文件
// 检查入参
// 检查环境变量
// 检查是否为最新版本
// 提示跟新
