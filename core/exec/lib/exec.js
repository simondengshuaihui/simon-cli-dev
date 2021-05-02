'use strict'
const Package = require('@simon-cli-dev/package')
const log = require('@simon-cli-dev/log')
const path = require('path')
module.exports = exec

const SETTINGS = {
  init: 'lodash',
}

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH

  log.verbose('targetPath:', targetPath)
  log.verbose('homePath:', homePath)

  let storeDir = ''
  const CACHE_DIR = 'dependencies'
  const commandObj = arguments[arguments.length - 1]
  const opts = commandObj.opts()
  const cmdName = commandObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'
  let pkg
  // targetPath 不存在的时候用缓存的package
  if (!targetPath) {
    //  自动生成缓存目录
    targetPath = path.resolve(homePath, CACHE_DIR)
    // 安装目录
    storeDir = path.resolve(targetPath, 'node_modules')
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
      storeDir,
    })
    // 如果pkg存在
    if (await pkg.exist()) {
      // 更新
      await pkg.update()
    } else {
      // 安装
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    })
  }
  // 获取安装目录,引用执行
  const rootFile = pkg.getRootFilePath()
  console.log(rootFile)
  if (rootFile) {
    log.verbose(`目标文件地址:${rootFile}`)
    // require(rootFile).apply(null, arguments)
  }
}
