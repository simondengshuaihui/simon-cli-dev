'use strict'
const Package = require('@simon-cli-dev/package')
const log = require('@simon-cli-dev/log')
const path = require('path')
const cp = require('child_process')
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
    try {
      // 用node子进程调用
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const o = Object.create(null)
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent'
        ) {
          o[key] = cmd[key]
        }
      })
      args[args.length - 1] = o
      const code = `require('${rootFile}').call(null,${JSON.stringify(args)})`
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      })
      child.on('error', (e) => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', (e) => {
        log.verbose('命令执行成功')
        process.exit(e)
      })
    } catch (err) {
      log.error(err.message)
    }
  }
}

function spawn(command, args, options) {
  // 兼容windows执行
  const isWindows = process.platform === 'win32'
  const cmd = isWindows ? 'cmd' : command
  const cmdArgs = isWindows ? ['/c'].concat(args) : args
  return cp.spawn(cmd, cmdArgs, options)
}
