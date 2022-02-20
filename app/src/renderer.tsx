/* eslint-disable */

import fs from 'fs';
import path from 'path';
import process from 'process';

import React from 'react';

// @ts-ignore
import makeCommonWebpackConfig from '@kibalabs/build/scripts/common/common.webpack';
// @ts-ignore
import makeCssWebpackConfig from '@kibalabs/build/scripts/common/css.webpack';
// @ts-ignore
import makeImagesWebpackConfig from '@kibalabs/build/scripts/common/images.webpack';
// @ts-ignore
import makeJsWebpackConfig from '@kibalabs/build/scripts/common/js.webpack';
// @ts-ignore
import { createAndRunCompiler } from '@kibalabs/build/scripts/common/webpackUtil';
// @ts-ignore
import makeReactAppWebpackConfig from '@kibalabs/build/scripts/react-app/app.webpack';
// @ts-ignore
import makeReactComponentWebpackConfig from '@kibalabs/build/scripts/react-component/component.webpack';
import { IHead, IHeadTag } from '@kibalabs/ui-react';
import { Chunk, ChunkExtractor, ChunkExtractorManager } from '@loadable/server';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import webpackMerge from 'webpack-merge';


export interface IPage {
  path: string;
  filename: string;
}

export const findAncestorSibling = (name: string, startingDirectory?: string): string[] => {
  let directory = path.resolve(startingDirectory || '');
  const rootDirectory = path.parse(directory).root;

  const output: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const potentialDirectory = path.join(directory, name);
    if (fs.existsSync(potentialDirectory)) {
      output.push(potentialDirectory);
    }
    if (directory === rootDirectory) {
      break;
    }
    directory = path.dirname(directory);
  }
  return output;
};

export const render = async (sourceDirectoryPath: string, buildDirectoryPath?: string, outputDirectoryPath?: string, inputParams?: Record<string, unknown>): Promise<void> => {
  const defaultParams = {
    configModifier: undefined,
    dev: false,
    webpackConfigModifier: undefined,
    analyzeBundle: false,
    shouldAliasModules: false,
    addHtmlOutput: false,
  };
  let params = { ...defaultParams, ...inputParams };
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const configModifier = require(path.join(process.cwd(), params.configModifier));
    params = configModifier(params);
  }
  if (params.dev) {
    throw Error('Unable to run static build in dev mode');
  }
  process.env.NODE_ENV = params.dev ? 'development' : 'production';

  const sourceDirectory = path.resolve(sourceDirectoryPath);
  const buildDirectory = buildDirectoryPath ? path.resolve(buildDirectoryPath) : path.join(process.cwd(), 'build');
  const outputDirectory = outputDirectoryPath ? path.resolve(outputDirectoryPath) : path.join(process.cwd(), 'dist');

  const pages: IPage[] = [{
    path: '/',
    filename: 'index.html',
  }, {
    path: '/about',
    filename: 'about/index.html',
  }, {
    path: '/roadmap',
    filename: 'roadmap/index.html',
  }];

  // NOTE(krishan711): this is weird.. find an alternative (taking into account EP uses workspaces)
  const nodeModulesPaths = findAncestorSibling('node_modules');
  let nodeWebpackConfig = webpackMerge(
    makeCommonWebpackConfig({ ...params, name: 'site-node' }),
    makeJsWebpackConfig({ ...params, polyfill: false, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    makeReactComponentWebpackConfig({ ...params, entryFilePath: path.join(sourceDirectory, './app.tsx'), outputDirectory: buildDirectory, excludeAllNodeModules: true, nodeModulesPaths }),
  );
  if (params.webpackConfigModifier) {
    nodeWebpackConfig = params.webpackConfigModifier(nodeWebpackConfig);
  }

  let webWebpackConfig = webpackMerge(
    makeCommonWebpackConfig({ ...params, name: 'site' }),
    makeJsWebpackConfig({ ...params, polyfill: true, react: true }),
    makeImagesWebpackConfig(params),
    makeCssWebpackConfig(params),
    makeReactAppWebpackConfig({ ...params, entryFilePath: path.join(sourceDirectory, './index.tsx'), outputDirectory }),
  );
  if (params.webpackConfigModifier) {
    webWebpackConfig = params.webpackConfigModifier(webWebpackConfig);
  }

  await createAndRunCompiler(nodeWebpackConfig);
  // // NOTE(krishan711): this ensures the require is not executed at build time (only during runtime)
  // @ts-ignore
  // eslint-disable-next-line no-undef
  // const { App } = __non_webpack_require__(path.resolve(buildDirectory, 'index.js'));
  const { App } = require(path.resolve(buildDirectory, 'index.js'));
  const webpackBuildStats = await createAndRunCompiler(webWebpackConfig);
  pages.forEach((page: IPage): void => {
    console.log(`EP: rendering page ${page.path} to ${page.filename}`);
    let pageHead: IHead = { headId: '', base: null, title: null, links: [], metas: [], styles: [], scripts: [], noscripts: [] };
    const setHead = (newHead: IHead): void => { pageHead = newHead; };
    const styledComponentsSheet = new ServerStyleSheet();
    const extractor = new ChunkExtractor({ stats: webpackBuildStats });
    const bodyString = ReactDOMServer.renderToString(
      <ChunkExtractorManager extractor={extractor}>
        <StyleSheetManager sheet={styledComponentsSheet.instance}>
          <App staticPath={page.path} setHead={setHead} />
        </StyleSheetManager>
      </ChunkExtractorManager>,
    );
    const tags: IHeadTag[] = [
      ...(pageHead.title ? [pageHead.title] : []),
      ...(pageHead.base ? [pageHead.base] : []),
      ...pageHead.links,
      ...pageHead.metas,
      ...pageHead.styles,
      ...pageHead.scripts,
    ];
    const headString = ReactDOMServer.renderToStaticMarkup(
      <head>
        {tags.map((tag: IHeadTag, index: number): React.ReactElement => (
          React.createElement(tag.type, { ...tag.attributes, key: index, 'ui-react-head': tag.headId }, tag.content)
        ))}
        {extractor.getPreAssets().map((asset: Chunk): React.ReactElement => (
          React.createElement('link', { key: asset.filename, 'data-chunk': asset.chunk, rel: asset.linkType, as: asset.scriptType, href: asset.url })
        ))}
        {styledComponentsSheet.getStyleElement()}
      </head>,
    );
    const bodyAssetsString = ReactDOMServer.renderToStaticMarkup(
      <React.Fragment>
        {extractor.getMainAssets().map((asset: Chunk): React.ReactElement => (
          React.createElement(asset.scriptType, { key: asset.filename, 'data-chunk': asset.chunk, async: true, src: asset.url })
        ))}
      </React.Fragment>,
    );
    const output = `<!DOCTYPE html>
      <html lang="en">
        ${headString}
        <body>
          <div id="root">${bodyString}</div>
          ${bodyAssetsString}
        </body>
      </html>
    `;
    const outputPath = path.join(outputDirectory, page.filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    console.log(`EP: done rendering page ${page.path} to ${page.filename}`);
  });
  console.log('EP: done generating static html');
};
