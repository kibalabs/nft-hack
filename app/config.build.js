/* eslint-disable */
const InjectSeoPlugin = require('@kibalabs/build/scripts/plugins/injectSeoPlugin');
const webpack = require('webpack');

const title = 'Million Dollar Token Page';
const description = 'MillionDollarTokenPage (MDTP) is the Homepage of the Metaverse. Discover the latest NFTs and own a piece of the front-page of the new internet!';
const url = 'https://milliondollartokenpage.com'
const imageUrl = `${url}/assets/banner.png`;

const seoTags = [
  new InjectSeoPlugin.MetaTag('description', description),
  new InjectSeoPlugin.Tag('meta', {property: 'og:type', content: 'website'}),
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
    webpackConfig.resolve.fallback = {
      ...webpackConfig.resolve.fallback,
      "querystring": false,
      "url": false,
    };
    webpackConfig.plugins = [
      ...webpackConfig.plugins,
      new webpack.DefinePlugin({
        // NOTE(krishan711): this is only here because web3.storage uses parse-link-header which uses these
        // Remove it once either of these has fixed this shitty implementation
        'process.env.PARSE_LINK_HEADER_MAXLEN': 2000,
        'process.env.PARSE_LINK_HEADER_THROW_ON_MAXLEN_EXCEEDED': null,
      }),
    ];
    return webpackConfig;
  };
  config.pages = [{
    path: '/',
    filename: 'index.html',
  }, {
    path: '/about',
    filename: 'about.html',
    seoTags: [
      new InjectSeoPlugin.MetaTag('description', description),
      new InjectSeoPlugin.Tag('meta', {property: 'og:type', content: 'website'}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:title', content: `About | ${title}`}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:description', content: description}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:image', content: imageUrl}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:url', content: `${url}/about`}),
      new InjectSeoPlugin.MetaTag('twitter:card', 'summary_large_image'),
      new InjectSeoPlugin.MetaTag('twitter:site', '@mdtp_app'),
      new InjectSeoPlugin.Tag('link', {rel: 'icon', type: 'image/svg+xml', href: '/assets/favicon.svg'}),
    ],
  }, {
    path: '/roadmap',
    filename: 'roadmap.html',
    seoTags: [
      new InjectSeoPlugin.MetaTag('description', description),
      new InjectSeoPlugin.Tag('meta', {property: 'og:type', content: 'website'}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:title', content: `Roadmap | ${title}`}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:description', content: description}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:image', content: imageUrl}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:url', content: `${url}/roadmap`}),
      new InjectSeoPlugin.MetaTag('twitter:card', 'summary_large_image'),
      new InjectSeoPlugin.MetaTag('twitter:site', '@mdtp_app'),
      new InjectSeoPlugin.Tag('link', {rel: 'icon', type: 'image/svg+xml', href: '/assets/favicon.svg'}),
    ],
  }, {
    path: '/share',
    filename: 'share.html',
    seoTags: [
      new InjectSeoPlugin.MetaTag('description', description),
      new InjectSeoPlugin.Tag('meta', {property: 'og:type', content: 'website'}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:title', content: `Share | ${title}`}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:description', content: description}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:image', content: imageUrl}),
      new InjectSeoPlugin.Tag('meta', {property: 'og:url', content: `${url}/share`}),
      new InjectSeoPlugin.MetaTag('twitter:card', 'summary_large_image'),
      new InjectSeoPlugin.MetaTag('twitter:site', '@mdtp_app'),
      new InjectSeoPlugin.Tag('link', {rel: 'icon', type: 'image/svg+xml', href: '/assets/favicon.svg'}),
    ],
  }];
  return config;
};
