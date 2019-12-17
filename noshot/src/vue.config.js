// vue.config.js
module.exports = {
  devServer: {
    // host: '0.0.0.0',
    // headers: { "Access-Control-Allow-Origin": "*",  'Access-Control-Allow-Headers': '*'},
    // proxy: 'localhost:80',
    // disableHostCheck: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  }
}
