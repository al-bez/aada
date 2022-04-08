const withImages = require('next-images');

module.exports = withImages({
  images: {
    disableStaticImages: true
  },
  reactStrictMode: false,
  webpack(config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true
    };
    return config;
  },
  // experimental: { nftTracing: true }
  // serverRuntimeConfig: {
  //   PROJECT_ROOT: __dirname
  // }
});

