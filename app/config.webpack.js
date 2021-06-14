/* eslint-disable */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CreateRuntimeConfigPlugin = require('@kibalabs/build/scripts/plugins/createRuntimeConfigPlugin')

const title = 'Million Dollar Token Page';
const description = 'MillionDollarTokenPage (MDTP) is a digital advertising space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market. So join us and interact, trade and share, and make crypto history!';
const imageUrl = 'https://wml-images.s3-eu-west-1.amazonaws.com/mdtp-banner.png';

class HtmlWebpackInjectSeo {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('HtmlWebpackInjectSeo', compilation => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('HtmlWebpackInjectSeo.beforeEmit', (htmlPluginData, callback) => {
        htmlPluginData.html = htmlPluginData.html.replace(/<title>.*<\/title>/i, `<title>${title}</title>`);
        callback(null, htmlPluginData);
      });
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync('HtmlWebpackInjectSeo.alterAssetTagGroups', (htmlPluginData, callback) => {
        htmlPluginData.headTags.push({
          tagName: 'meta',
          attributes: {
            "name": "og:title",
            "content": title,
          },
        });
        htmlPluginData.headTags.push({
          tagName: 'meta',
          attributes: {
            "name": "description",
            "content": description,
          },
        });
        htmlPluginData.headTags.push({
          tagName: 'meta',
          attributes: {
            "name": "og:description",
            "content": description,
          },
        });
        htmlPluginData.headTags.push({
          tagName: 'meta',
          attributes: {
            "name": "og:url",
            "content": "https://milliondollartokenpage.com",
          },
        });
        htmlPluginData.headTags.push({
          tagName: 'meta',
          attributes: {
            "name": "og:image",
            "content": imageUrl,
          },
        });
        htmlPluginData.headTags.push({
          tagName: 'meta',
          attributes: {
            "name": "twitter:card",
            "content": "summary_large_image",
          },
        });
        callback(null, htmlPluginData);
      });
    });
  }
}

module.exports = (config) => {
  config.resolve = config.resolve || {};
  config.plugins = [
    ...config.plugins.filter((plugin) => !(plugin instanceof CreateRuntimeConfigPlugin)),
    new CreateRuntimeConfigPlugin({
      'KRT_CONTRACT_ADDRESS': process.env.KRT_CONTRACT_ADDRESS,
      'KRT_API_URL': process.env.KRT_API_URL,
    }),
    new HtmlWebpackInjectSeo(),
  ];
  return config;
};
