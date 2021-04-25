import React from 'react';

import { Alignment, Box, LayerContainer, LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { GridItem } from '../../client';
import { AboutIcon } from '../../components/AboutIcon';
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
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    mdtpClient.listGridItems().then((retrievedGridItems: GridItem[]): void => {
      const sortedGridItems = retrievedGridItems.sort((gridItem1: GridItem, gridItem2: GridItem): number => gridItem1.gridItemId - gridItem2.gridItemId);
      // setGridItems(Array(10000).fill(null).map((_: unknown, index: number): GridItem => {
      setGridItems(Array(1000).fill(null).map((_: unknown, index: number): GridItem => {
        const originalGridItem = sortedGridItems[index % sortedGridItems.length];
        const gridItem = Object.assign(Object.create(Object.getPrototypeOf(originalGridItem)), originalGridItem);
        gridItem.gridItemId = index;
        return gridItem;
      }));
      // setGridItems(retrievedGridItems);
    });
  }, [mdtpClient]);

  React.useEffect((): void => {
    loadGridItems();
    if (web3) {
      web3.eth.getChainId().then((chainId: number): void => {
        if (!contract) {
          setErrorText('Install Metamask to buy a token!');
        } else if (chainId !== ChainId.Rinkeby) {
          setErrorText('We currently only support Rinkeby, please switch networks within Metamask and refresh');
        } else {
          setErrorText(null);
        }
      });
    }
  }, [web3, contract, loadGridItems]);

  const onGridItemClicked = (gridItem: GridItem) => {
    window.open(`/tokens/${gridItem.tokenId}`, '_blank');
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      <LayerContainer>
        { gridItems === null ? (
          <LoadingSpinner />
        ) : (
          <TokenGrid gridItems={gridItems} onGridItemClicked={onGridItemClicked} />
        )}
        { errorText && (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false}>
            <Box variant='errorOverlay'>
              <Text>{errorText}</Text>
            </Box>
          </LayerContainer.Layer>
        )}
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <AboutIcon />
        </LayerContainer.Layer>
      </LayerContainer>
    </React.Fragment>
  );
};
