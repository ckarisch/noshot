// vue.config.js
module.exports = {
  devServer: {
    host: 'localhost',
    disableHostCheck: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  }
}
