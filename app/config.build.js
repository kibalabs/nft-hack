/* eslint-disable */
const InjectSeoPlugin = require('@kibalabs/build/scripts/plugins/injectSeoPlugin');

const title = 'Million Dollar Token Page';
const description = 'MillionDollarTokenPage (MDTP) is a digital advertising space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market. So join us and interact, trade and share, and make crypto history!';
const imageUrl = 'https://wml-images.s3-eu-west-1.amazonaws.com/mdtp-banner.png';
const url = 'https://milliondollartokenpage.com'

const seoTags = [
  new InjectSeoPlugin.MetaTag('og:title', title),
  new InjectSeoPlugin.MetaTag('description', description),
  new InjectSeoPlugin.MetaTag('og:description', description),
  new InjectSeoPlugin.MetaTag('twitter:card', 'summary_large_image'),
  new InjectSeoPlugin.MetaTag('og:image', imageUrl),
  new InjectSeoPlugin.MetaTag('og:url', url),
];

module.exports = (config) => {
  config.seoTags = seoTags;
  config.title = title;
  return config;
};
