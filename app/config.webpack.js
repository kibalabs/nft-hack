/* eslint-disable */
const path = require('path');
const CreateRuntimeConfigPlugin = require('@kibalabs/build/scripts/plugins/createRuntimeConfigPlugin')

module.exports = (config) => {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react': path.resolve('./node_modules', 'react'),
    'react-dom': path.resolve('./node_modules', '@hot-loader/react-dom'),
    'styled-components': path.resolve('./node_modules', 'styled-components'),
    '@kibalabs/core': path.resolve('./node_modules', '@kibalabs/core'),
    '@kibalabs/core-react': path.resolve('./node_modules', '@kibalabs/core-react'),
    '@kibalabs/ui-react': path.resolve('./node_modules', '@kibalabs/ui-react'),
  };
  config.plugins = [
    ...config.plugins.filter((plugin) => !(plugin instanceof CreateRuntimeConfigPlugin)),
    new CreateRuntimeConfigPlugin({
      'KRT_CONTRACT_ADDRESS': process.env.KRT_CONTRACT_ADDRESS,
      'KRT_API_URL': process.env.KRT_API_URL,
    }),
  ];
  return config;
};
