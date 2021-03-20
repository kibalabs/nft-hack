import { RecursivePartial } from '@kibalabs/core';

import { IBoxTheme, ThemeType } from '@kibalabs/ui-react';

export interface ITokenBoxThemeBase extends ThemeType {
  background: IBoxTheme;
}

export interface ITokenBoxThemeState extends ThemeType {
  default: ITokenBoxThemeBase;
  hover: RecursivePartial<ITokenBoxThemeBase>;
  press: RecursivePartial<ITokenBoxThemeBase>;
  focus: RecursivePartial<ITokenBoxThemeBase>;
}

export interface ITokenBoxTheme extends ThemeType {
  normal: ITokenBoxThemeState;
  disabled: RecursivePartial<ITokenBoxThemeState>;
}
