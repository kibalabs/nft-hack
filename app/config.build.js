/* eslint-disable */
const InjectSeoPlugin = require('@kibalabs/build/scripts/plugins/injectSeoPlugin');

const title = 'Million Dollar Token Page';
const description = 'MillionDollarTokenPage (MDTP) is the Homepage of the Metaverse. Discover the latest NFTs and own a piece of the front-page of the new internet!';
const url = 'https://milliondollartokenpage.com'
const imageUrl = `${url}/assets/banner.png`;

const seoTags = [
  new InjectSeoPlugin.MetaTag('description', description),
  new InjectSeoPlugin.Tag('meta', {property: 'og:title', content: title}),
  new InjectSeoPlugin.Tag('meta', {property: 'og:description', content: description}),
  new InjectSeoPlugin.Tag('meta', {property: 'og:image', content: imageUrl}),
  new InjectSeoPlugin.Tag('meta', {property: 'og:url', content: url}),
  new InjectSeoPlugin.MetaTag('twitter:card', 'summary_large_image'),
  new InjectSeoPlugin.MetaTag('twitter:site', '@mdtp_app'),
  new InjectSeoPlugin.Tag('link', {rel: 'canonical', href: url}),
  new InjectSeoPlugin.Tag('link', {rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/apple-touch-icon.png'}),
  new InjectSeoPlugin.Tag('link', {rel: 'icon', type: 'image/svg+xml', href: '/assets/favicon.svg'}),
  new InjectSeoPlugin.Tag('link', {rel: 'alternate icon', href: '/assets/favicon.ico'}),
  new InjectSeoPlugin.Tag('link', {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/assets/favicon-16x16.png'}),
  new InjectSeoPlugin.Tag('link', {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/assets/favicon-32x32.png'}),
  new InjectSeoPlugin.MetaTag('ahrefs-site-verification', 'a3023b147a43620661343c066e99f489fb5c806d21df477f183a30c2428ab64b'),
];

module.exports = (config) => {
  config.seoTags = seoTags;
  config.title = title;
  config.webpackConfigModifier = (webpackConfig) => {
    webpackConfig.devServer = {
      historyApiFallback: {
        disableDotRule: true,
      },
    };
    webpackConfig.resolve = webpackConfig.resolve || {};
    webpackConfig.resolve.fallback = webpackConfig.resolve.fallback || {};
    webpackConfig.resolve.fallback.querystring = require.resolve("querystring-es3");
    return webpackConfig;
  }
  return config;
};
