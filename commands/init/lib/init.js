'use strict'
const Command = require('@simon-cli-dev/command')
const semver = require('semver')
const colors = require('colors')
const log = require('@simon-cli-dev/log')
const Package = require('@simon-cli-dev/package')
const { spinnerStart, sleep } = require('@simon-cli-dev/utils')
const userHome = require('user-home')
const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const getProjectTemplate = require('./getProjectTemplate')

const LOWEST_NODE_VERSION = '12.0.0'
const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'
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

  async exec() {
    try {
      // 1.准备阶段
      const projectInfo = await this.prepare()
      this.projectInfo = projectInfo
      if (projectInfo) {
        log.verbose('projectInfo:', projectInfo)
        // 2.下载模板
        await this.downloadTemplate()
        // 3.安装模板
        await this.installTemplate()
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  async prepare() {
    // 检查模板是否存在
    const templateList = await getProjectTemplate()
    if (!templateList || templateList.length === 0) {
      throw new Error('项目模板不存在')
    }
    this.templateList = templateList
    const localPath = process.cwd()
    let isContinious = false
    // 判断当前是否为空
    if (!this.isDirEnpty(localPath)) {
      // 是否启动强制跟新
      if (!this.force) {
        const anwser = await inquirer.prompt({
          type: 'confirm',
          name: 'isContinious',
          message: '当前文件夹不为空，是否继续创建项目？',
        })
        isContinious = anwser.isContinious
        if (!isContinious) return
      }
      if (this.force || isContinious) {
        // 二次确认
        const { confirmDelet } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelet',
          message: '是否确认清空当前文件',
        })
        if (confirmDelet) {
          fse.emptyDirSync(localPath)
        }
      }
    }
    // 选择创建组件或项目以及项目信息
    return this.getProjectInfo()
  }

  async getProjectInfo() {
    let projectInfo = {}
    // 确定创建类型
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择创建类型',
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT,
        },
        {
          name: '组件',
          value: TYPE_COMPONENT,
        },
      ],
      default: TYPE_PROJECT,
    })
    if (type === TYPE_PROJECT) {
      const o = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: '',
          validate: function (v) {
            const r = /^[a-zA-Z]+([-|_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/
            const valid = r.test(v)
            const done = this.async()
            setTimeout(() => {
              if (!valid) {
                done('请输入合法的项目名称,字符或用"_"、"-"链接')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: (v) => {
            return v
          },
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入版本号',
          default: '1.0.0',
          validate: function (v) {
            const done = this.async()
            setTimeout(() => {
              if (!!!semver.valid(v)) {
                done('请输入合法的版本号：例如1.2.0')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: (v) => {
            if (semver.valid(v)) {
              return semver.valid(v)
            } else {
              return v
            }
          },
        },
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择模板',
          choices: this.createTemplateChoices(),
          default: '',
        },
      ])
      projectInfo = { type, ...o }
    } else if (type === TYPE_COMPONENT) {
    }
    return projectInfo
  }

  createTemplateChoices() {
    return this.templateList.map((template) => {
      return {
        name: template.name,
        value: template.npmName,
      }
    })
  }
  async downloadTemplate() {
    // 通过项目模板API获取模板
    // 1.使用egg搭建后台，
    // 2.发布template包到npm
    // 3.mongo存储模板数据
    // 4.通过api请求服务下载模板
    const { projectTemplate } = this.projectInfo
    const templateInfo = this.templateList.find(
      (item) => item.npmName === projectTemplate
    )
    this.templateInfo = templateInfo
    const targetPath = path.resolve(userHome, '.simon-cli', 'template')
    const storeDir = path.resolve(
      userHome,
      '.simon-cli',
      'template',
      'node_modules'
    )
    const { npmName, npmVersion } = templateInfo
    const templateNpm = new Package({
      targetPath,
      packageName: npmName,
      packageVersion: npmVersion,
      storeDir,
    })

    if (!(await templateNpm.exist())) {
      // 安装package
      const spinner = spinnerStart('正在下载模板...')
      await sleep()
      try {
        await templateNpm.install()
      } catch (error) {
        throw errror
      } finally {
        spinner.stop(true)
        if (templateNpm.exist()) log.success('模板下载成功')
      }
    } else {
      const spinner = spinnerStart('正在更新模板...')
      await sleep()
      try {
        await templateNpm.update()
      } catch (error) {
        throw errror
      } finally {
        spinner.stop(true)
        if (templateNpm.exist()) log.success('模板跟新成功')
      }
    }
  }

  async installTemplate() {
    // 区分是否是定制版本
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 安装普通模板
        this.installNormalTemplate()
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        // 走定制安装
        this.installCustomTemplate()
      } else {
        throw new Error('无法识别模板信息')
      }
    } else {
      throw new Error('项目模板信息不存在')
    }
  }

  installNormalTemplate() {
    console.log('安装普通模板')
  }

  installCustomTemplate() {
    console.log('安装定制模板')
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }

  isDirEnpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    fileList.filter((file) => {
      return !file.startsWith('.') && !['node_modules'].includes(file)
    })
    return !fileList || fileList.length === 0
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
