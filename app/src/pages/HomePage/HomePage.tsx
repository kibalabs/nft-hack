import React from 'react';

import { Alignment, Box, LayerContainer, LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { GridItem } from '../../client';
import { RightHandSideButtons } from '../../components/RightHandSideButtons';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { isValidChain } from '../../util/chainUtil';

export const HomePage = (): React.ReactElement => {
  const { chainId, contract, apiClient, network } = useGlobals();
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    apiClient.listGridItems(network).then((retrievedGridItems: GridItem[]): void => {
      if (retrievedGridItems.length === 0) {
        setGridItems([]);
        return;
      }
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
  }, [network, apiClient]);

  React.useEffect((): void => {
    loadGridItems();
    if (!contract) {
      setErrorText('Install Metamask to buy a token!');
    } else if (!isValidChain(chainId)) {
      setErrorText('We currently only support Rinkeby and Mumbai. Please switch networks in Metamask and refresh');
    } else {
      setErrorText(null);
    }
  }, [chainId, contract, loadGridItems]);

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
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.Center}>
            <Box variant='overlay'>
              <Text>{errorText}</Text>
            </Box>
          </LayerContainer.Layer>
        )}
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
          <WelcomeOverlay />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <RightHandSideButtons />
        </LayerContainer.Layer>
      </LayerContainer>
    </React.Fragment>
  );
};
