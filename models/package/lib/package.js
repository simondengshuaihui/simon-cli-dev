'use strict'
const { isObject, formatPath } = require('@simon-cli-dev/utils')
const { getDefaultRegistry } = require('@simon-cli-dev/get-npm-info')
const pkgDir = require('pkg-dir').sync
const path = require('path')
const npmInstall = require('npminstall')
class Package {
  constructor(options) {
    if (!options && isObject(options)) {
      throw new Error('Package类的参数非对象')
    }
    this.targetPath = options.targetPath
    this.packageName = options.packageName
    this.packageVersion = options.packageVersion
    this.storeDir = options.storeDir
  }

  install() {
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
      registry: getDefaultRegistry(),
    })
  }

  update() {}

  exist() {}

  getRootPath() {
    // 获取目标路径的package.json 目录
    const dir = pkgDir(this.targetPath)
    if (dir) {
      const pkgFile = require(path.resolve(dir, 'package.json'))
      // 寻找main或者lib
      if (pkgFile && pkgFile.main) {
        // 路径兼容win和mac
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
  }
}

module.exports = Package
