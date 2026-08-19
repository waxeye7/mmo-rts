const { defineConfig } = require("@vue/cli-service");

const LIVE = "https://mmo.marlyman123.com";
const stampOrigin = (proxyReq) => {
  proxyReq.setHeader("Origin", LIVE);
};

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: "127.0.0.1",
    port: 8088,
    historyApiFallback: true,
    proxy: {
      "/auth": {
        target: LIVE,
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
        onProxyReq: stampOrigin,
      },
      "/users": {
        target: LIVE,
        changeOrigin: true,
        cookieDomainRewrite: "localhost",
        onProxyReq: stampOrigin,
      },
      "/public": {
        target: LIVE,
        changeOrigin: true,
        onProxyReq: stampOrigin,
      },
      "/socket.io": {
        target: LIVE,
        changeOrigin: true,
        ws: true,
        onProxyReq: stampOrigin,
        onProxyReqWs: stampOrigin,
      },
    },
  },
});

