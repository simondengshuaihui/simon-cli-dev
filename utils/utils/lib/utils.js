'use strict'
const path = require('path')
module.exports = {
  isObject,
  formatPath,
  spinnerStart,
  sleep,
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function spinnerStart(msg, spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner
  const spinner = new Spinner(`${msg}... $s`)
  spinner.setSpinnerString('|/-\\')
  spinner.start()
  return spinner
}

function sleep(timeout = 1000) {
  return new Promise((resolve, reject) => setTimeout(resolve, timeout))
}

function formatPath(p) {
  if (p && typeof p === 'string') {
    const sep = path.sep
    if (sep === '/') {
      return p
    } else {
      return p.replace(/\\/g, '/')
    }
  }
}
