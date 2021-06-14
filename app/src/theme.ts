import { RecursivePartial } from '@kibalabs/core';
import { buildTheme, IIconButtonTheme, ITheme, mergeTheme, mergeThemePartial, ThemeMap } from '@kibalabs/ui-react';

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

  const overlayBoxTheme = {
    'background-color': 'rgba(255, 255, 255, 0.75)',
    padding: '0.5em 1em',
    'backdrop-filter': 'blur(3px)',
  };

  const boxThemes = {
    ...defaultTheme.boxes,
    overlay: overlayBoxTheme,
    topRightCutoff: {
      'border-radius': '0 1em 0 0',
    },
    topLeftCutoff: {
      'border-radius': '1em 0 0 0',
    },
    bottomRightCutoff: {
      'border-radius': '0 0 1em 0',
    },
    bottomLeftCutoff: {
      'border-radius': '0 0 0 1em',
    },
    tokenHeader: mergeThemePartial(defaultTheme.boxes.card, {
      'border-radius': '0',
    }),
    homePanel: {
      'background-color': '$colors.background',
      'border-radius': '0 1em 1em 0',
      'box-shadow': 'rgb(50 50 93 / 25%) 13px 0 27px -5px, rgb(0 0 0 / 30%) 8px 0 16px -8px',
    },
    panelButtonHolder: {
      margin: '0.5em 1em',
    },
  };

  const iconButtonThemes: RecursivePartial<ThemeMap<IIconButtonTheme>> = {
    default: {
      normal: {
        default: {
          background: {
            'background-color': 'rgba(255, 255, 255, 0.75)',
            'backdrop-filter': overlayBoxTheme['backdrop-filter'],
          },
        },
        hover: {
          background: {
            'background-color': 'rgba(255, 255, 255, 0.5)',
          },
        },
      },
    },
    secondary: {
      normal: {
        default: {
          background: {
            'background-color': 'transparent',
            'border-width': '0',
            'backdrop-filter': 'none',
          },
        },
        hover: {
          background: {
            'background-color': 'rgba(255, 255, 255, 0.5)',
          },
        },
      },
    },
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
    iconButtons: iconButtonThemes,
  });
  return theme;
};
