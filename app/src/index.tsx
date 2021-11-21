import React from 'react';

import ReactDOM from 'react-dom';

import { App } from './app';

if (typeof document !== 'undefined') {
  const target = document.getElementById('root');
  const renderMethod = target.hasChildNodes() ? ReactDOM.hydrate : ReactDOM.render;
  const render = (Component: React.ReactElement): void => {
    renderMethod(<React.StrictMode><Component /></React.StrictMode>, target);
  };
  render(App);
}
