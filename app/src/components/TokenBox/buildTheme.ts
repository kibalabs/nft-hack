import { RecursivePartial } from '@kibalabs/core';

import { IBoxTheme, IColorGuide, IDimensionGuide, ITextTheme,  mergeTheme, mergeThemePartial, ThemeMap } from '@kibalabs/ui-react';
import { ITokenBoxTheme } from './theme';

export const buildTokenBoxThemes = (colors: IColorGuide, dimensions: IDimensionGuide, textThemes: ThemeMap<ITextTheme>, boxThemes: ThemeMap<IBoxTheme>, base?: RecursivePartial<Record<string, ITokenBoxTheme>>): ThemeMap<ITokenBoxTheme> => {
  const defaultTokenBoxTheme = mergeTheme<ITokenBoxTheme>({
    normal: {
      default: {
        background: mergeTheme(boxThemes.default, boxThemes.focusable, {
          padding: '0',
          'background-color': 'transparent',
        }),
      },
      hover: {
        background: {
          'background-color': '$colors.brandPrimaryClear90',
        },
      },
      press: {
        background: {
          'background-color': '$colors.brandPrimaryClear80',
        },
      },
      focus: {
        background: boxThemes.focussed,
      },
    },
    disabled: {
      default: {
        background: {
          'background-color': '$colors.disabledLight50',
        },
        text: {
          color: '$colors.disabledText',
        },
      },
    },
  }, base?.default);

  return {
    ...(base || {}),
    default: defaultTokenBoxTheme,
  };
};
