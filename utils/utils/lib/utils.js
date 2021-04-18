'use strict'
const path = require('path')
module.exports = {
  isObject,
  formatPath,
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
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
