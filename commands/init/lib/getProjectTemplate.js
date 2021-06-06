const requset = require('@simon-cli-dev/request')

module.exports = function () {
  return requset({
    url: '/project/template',
  })
}
