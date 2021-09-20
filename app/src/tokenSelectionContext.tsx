import React from 'react';

import { IMultiAnyChildProps } from '@kibalabs/core-react';


export const TokenSelectionContext = React.createContext<number[]>([]);
export const SetTokenSelectionContext = React.createContext<(tokenSelection: number[]) => void>(() => null);

interface TokenSelectionProviderProps extends IMultiAnyChildProps {
  tokenSelection: number[];
  setTokenSelection: (tokenSelection: number[]) => void;
}

export const TokenSelectionProvider = (props: TokenSelectionProviderProps): React.ReactElement => (
  <TokenSelectionContext.Provider value={props.tokenSelection}>
    <SetTokenSelectionContext.Provider value={props.setTokenSelection}>
      {props.children}
    </SetTokenSelectionContext.Provider>
  </TokenSelectionContext.Provider>
);

export const useTokenSelection = (): number[] => {
  const tokenSelection = React.useContext(TokenSelectionContext);
  if (!tokenSelection) {
    throw new Error('Cannot use useTokenSelection since tokenSelection has not ben provided above in the hierarchy');
  }
  return tokenSelection;
};

export const useSetTokenSelection = (): ((tokenSelection: number[]) => void) => {
  const setTokenSelection = React.useContext(SetTokenSelectionContext);
  if (!setTokenSelection) {
    throw new Error('Cannot use useSetTokenSelection since setTokenSelection has not ben provided above in the hierarchy');
  }
  return setTokenSelection;
};
