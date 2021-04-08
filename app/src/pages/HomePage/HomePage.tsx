import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { GridItem } from '../../client';
import { TokenGrid } from '../../components/TokenGrid';
import { useGlobals } from '../../globalsContext';

enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
}

export const HomePage = (): React.ReactElement => {
  const { web3, contract, mdtpClient } = useGlobals();
  const navigator = useNavigator();
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);
  const [chainId, setChainId] = React.useState<number | null>(null);

  if (web3) {
    web3.eth.getChainId().then(setChainId);
  }

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    mdtpClient.listGridItems().then((retrievedGridItems: GridItem[]): void => {
      setGridItems(retrievedGridItems);
    });
  }, [mdtpClient]);

  React.useEffect((): void => {
    loadGridItems();
    if (!contract) {
      setErrorText('Install Metamask to be able to buy a token!');
    } else if (chainId !== ChainId.Rinkeby) {
      setErrorText('We only support Rinkeby right now, please switch networks within Metamask and refresh');
    } else {
      setErrorText(null);
    }
  }, [chainId, contract, loadGridItems]);

  const onGridItemClicked = (gridItem: GridItem) => {
    navigator.navigateTo(`/tokens/${gridItem.tokenId}`);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      <Text>{errorText}</Text>
      { gridItems === null ? (
        <LoadingSpinner />
      ) : (
        <TokenGrid gridItems={gridItems} onGridItemClicked={onGridItemClicked} />
      )}
    </React.Fragment>
  );
};
