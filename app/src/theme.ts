import { buildTheme, ITheme, mergeTheme, mergeThemePartial } from '@kibalabs/ui-react';

import { buildTokenBoxThemes } from './components/TokenBox';

export const defaultTheme = buildTheme();
export const buildMDTPTheme = (): ITheme => {
  const colors = {
    ...defaultTheme.colors,
    // brandPrimary: '#6F0000',
    // brandSecondary: '#200122',
    // background: '#000000',
    // text: '#ffffff',
    // placeholderText: 'rgba(255, 255, 255, 0.5)',
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
    tokenBoxes: buildTokenBoxThemes(colors, defaultTheme.dimensions, textThemes, boxThemes),
    // boxes: {
    //   card: {
    //     padding: '0',
    //     'background-color': 'rgba(255, 255, 255, 0.15)',
    //     'border-width': '0',
    //     // 'border-width': '1px',
    //     // 'border-color': 'rgba(255, 255, 255, 0.5)',
    //     // 'border-style': 'solid',
    //     margin: '0',
    //   },
    //   cardLabelBox: {
    //     'border-radius': '0.5em 0 0.2em 0',
    //     padding: '0.5em 1em',
    //   },
    //   cardLabelBoxSponsored: {
    //     'background-color': 'rgba(238, 213, 102, 0.25)',
    //   },
    //   cardLabelBoxRandom: {
    //     'background-color': 'rgba(46, 180, 255, 0.25)',
    //   },
    // },
    // iconButtons: {
    //   default: {
    //     disabled: {
    //       default: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0)',
    //         },
    //       },
    //     },
    //   },
    // },
    // buttons: {
    //   primary: {
    //     normal: {
    //       default: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.25)',
    //           'border-color': 'rgba(255, 255, 255, 0.3)',
    //           'border-width': '1px',
    //         },
    //         text: {
    //           color: '$colors.textOnBrand',
    //         },
    //       },
    //       hover: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.35)',
    //         },
    //       },
    //       press: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.55)',
    //         },
    //       },
    //       focus: {
    //         background: {
    //           'border-color': 'rgba(255, 255, 255, 0.75)',
    //         },
    //       },
    //     },
    //   },
    //   secondary: {
    //     normal: {
    //       default: {
    //         background: {
    //           'border-color': 'rgba(255, 255, 255, 0.3)',
    //           'border-width': '1px',
    //         },
    //         text: {
    //           color: '$colors.textOnBrand',
    //         },
    //       },
    //       hover: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.35)',
    //         },
    //       },
    //       press: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.55)',
    //         },
    //       },
    //       focus: {
    //         background: {
    //           'border-color': 'rgba(255, 255, 255, 0.75)',
    //         },
    //       },
    //     },
    //   },
    //   tertiary: {
    //     normal: {
    //       default: {
    //         background: {
    //           'border-width': '0',
    //         },
    //         text: {
    //           color: '$colors.textOnBrand',
    //         },
    //       },
    //       hover: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.35)',
    //         },
    //       },
    //       press: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.55)',
    //         },
    //       },
    //       focus: {
    //         background: {
    //           'border-color': 'rgba(255, 255, 255, 0.75)',
    //         },
    //       },
    //     },
    //   },
    // },
    // dialogs: {
    //   default: {
    //     backdropColor: 'rgba(0, 0, 0, 0.7)',
    //     background: {
    //       'background-color': '$colors.brandPrimaryDark10',
    //     },
    //   },
    // },
    // inputWrappers: {
    //   dialogInput: {
    //     normal: {
    //       default: {
    //         background: {
    //           'background-color': 'rgba(255, 255, 255, 0.25)',
    //         },
    //       },
    //     },
    //   },
    // },
  });
  return theme;
};
