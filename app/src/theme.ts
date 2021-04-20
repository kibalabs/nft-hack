import { buildTheme, ITheme, mergeTheme, mergeThemePartial } from '@kibalabs/ui-react';

export const defaultTheme = buildTheme();
export const buildMDTPTheme = (): ITheme => {
  const colors = {
    ...defaultTheme.colors,
  };
  const textThemes = {
    ...defaultTheme.texts,
    default: mergeTheme(defaultTheme.texts.default, {
      'font-family': "'Open Sans', sans-serif",
      'font-weight': '400',
    }),
    light: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    preheading: {
      'text-transform': 'uppercase',
      'font-weight': 'bold',
    },
  };
  const boxThemes = {
    ...defaultTheme.boxes,
    connectionOverlay: {
      'background-color': 'rgba(255, 255, 255, 0.75)',
      padding: '0.5em 1em',
      'border-radius': '0 1em 0 0',
      'backdrop-filter': 'blur(5px)',
    },
    aboutOverlay: {
      'background-color': 'rgba(255, 255, 255, 0.75)',
      padding: '0.5em 1em',
      'border-radius': '1em 0 0 0',
      'backdrop-filter': 'blur(5px)',
    },
    errorOverlay: {
      'background-color': 'rgba(255, 255, 255, 0.75)',
      padding: '0.5em 1em',
      'border-radius': '0 0 1em 0',
      'backdrop-filter': 'blur(5px)',
    },
    tokenHeader: mergeThemePartial(defaultTheme.boxes.card, {
      'border-radius': '0',
    }),
  };
  const theme = buildTheme({
    colors,
    fonts: {
      main: {
        url: 'https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800,900&display=swap',
      },
    },
    texts: textThemes,
    boxes: boxThemes,
  });
  return theme;
};
