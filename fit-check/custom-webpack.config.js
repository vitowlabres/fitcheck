// custom-webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "vm": require.resolve("vm-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  }
};