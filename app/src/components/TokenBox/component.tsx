import React from 'react';

import { getClassName } from '@kibalabs/core';
import { IMultiAnyChildProps } from '@kibalabs/core-react';
import { defaultComponentProps, IComponentProps, themeToCss, useBuiltTheme } from '@kibalabs/ui-react';
import styled from 'styled-components';

import { ITokenBoxTheme } from './theme';

interface IStyledTokenBoxProps {
  theme: ITokenBoxTheme;
}

const StyledTokenBox = styled.div<IStyledTokenBoxProps>`
  ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.normal.default.background)};
  &:visited {
    ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.normal.default.background)};
  }
  cursor: pointer;
  outline: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-clip: border-box;
  transition-duration: 0.3s;
  width: 300px;
  height: 200px;

  &:hover {
    ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.normal.hover?.background)};
    zoom: 1.3;
    z-index: 100;
    box-shadow: 5px 0px 30px rgba(0, 0, 0, 0.5);
    margin-left: calc(300px * -0.3 / 2.0);
    margin-top: calc(200px * -0.2 / 2.0);
    margin-bottom: calc(200px * -0.2); /// Note the added removal of the bottom margin that all "non" active elements have
  }
  &:active {
    ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.normal.press?.background)};
  }
  &:focus {
    ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.normal.focus?.background)};
  }
  &.disabled {
    cursor: not-allowed;
    ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.disabled.default?.background)};
    &:hover {
      ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.disabled.hover?.background)};
    }
    &:active {
      ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.disabled.press?.background)};
    }
    &:focus {
      ${(props: IStyledTokenBoxProps): string => themeToCss(props.theme.disabled.focus?.background)};
    }
  }
`;

export interface ITokenBoxProps extends IComponentProps<ITokenBoxTheme>, IMultiAnyChildProps {
  onClicked?(): void;
}

export const TokenBox = (props: ITokenBoxProps): React.ReactElement => {
  const onClicked = (): void => {
    if (props.onClicked) {
      props.onClicked();
    }
  };

  const theme = useBuiltTheme('tokenBoxes', props.variant, props.theme);
  return (
    // @ts-ignore: as prop doesn't match type required
    <StyledTokenBox
      id={props.id}
      className={getClassName(TokenBox.displayName, props.className)}
      theme={theme}
      onClick={onClicked}
    >
      { props.children }
    </StyledTokenBox>
  );
};

TokenBox.displayName = 'TokenBox';
TokenBox.defaultProps = {
  ...defaultComponentProps,
};
