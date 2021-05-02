'use strict'
const { isObject, formatPath } = require('@simon-cli-dev/utils')
const log = require('@simon-cli-dev/log')
const fse = require('fs-extra')
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require('@simon-cli-dev/get-npm-info')
const pkgDir = require('pkg-dir').sync
const path = require('path')
const pathExists = require('path-exists').sync
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
    // package缓存目录前缀 lodash -> _lodash@4.17.21@lodash
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    )
  }

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    )
  }

  async install() {
    await this.prepare()
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
      registry: getDefaultRegistry(),
    })
  }

  async update() {
    console.log(`update ${this.packageName}`)
    await this.prepare()
    // 获取最新版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName)
    // 查询最新版本号路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
    log.verbose(`最新版本号${latestPackageVersion}`)
    // 如果不存在跟新版本
    if (!pathExists(latestFilePath)) {
      return npmInstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        pkgs: [{ name: this.packageName, version: latestPackageVersion }],
        registry: getDefaultRegistry(),
      })
      this.packageVersion = latestPackageVersion
    }
  }
  // 查询最新版本号
  async prepare() {
    // 确保storeDir缓存目录都存在
    if (!pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
    log.verbose(this.packageVersion)
  }
  // 判断当前package是否存在
  async exist() {
    // 如果有缓存路径
    if (this.storeDir) {
      await this.prepare()
      log.verbose(`缓存路径${this.cacheFilePath}`)
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targetPath)
    }
  }

  getRootFilePath() {
    // 如果有缓存路径检查路径是否存在package.json 如果不存在就找目标路径的package
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath)
    } else {
      return _getRootFile(this.targetPath)
    }
    function _getRootFile(targetPath) {
      // 获取目标路径的package.json 目录
      const dir = pkgDir(targetPath)
      if (dir) {
        const pkgFile = require(path.resolve(dir, 'package.json'))
        // 寻找main或者lib
        if (pkgFile && pkgFile.main) {
          // 路径兼容win和mac
          return formatPath(path.resolve(dir, pkgFile.main))
        }
        return null
      }
    }
  }
}

module.exports = Package
