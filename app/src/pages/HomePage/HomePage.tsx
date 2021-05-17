import React from 'react';

import { Alignment, Box, LayerContainer, LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { GridItem } from '../../client';
import { ButtonsOverlay } from '../../components/ButtonsOverlay';
import { NotificationOverlay } from '../../components/NotificationOverlay';
import { StatsOverlay } from '../../components/StatsOverlay';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { isValidChain } from '../../util/chainUtil';

export const HomePage = (): React.ReactElement => {
  const { chainId, contract, apiClient, network } = useGlobals();
  const [infoText, setInfoText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    apiClient.listGridItems(network).then((retrievedGridItems: GridItem[]): void => {
      if (retrievedGridItems.length === 0) {
        setGridItems([]);
        return;
      }
      const sortedGridItems = retrievedGridItems.sort((gridItem1: GridItem, gridItem2: GridItem): number => gridItem1.gridItemId - gridItem2.gridItemId);
      setGridItems(Array(10000).fill(null).map((_: unknown, index: number): GridItem => {
      // setGridItems(Array(1000).fill(null).map((_: unknown, index: number): GridItem => {
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
      setInfoText('Please install Metamask to interact fully with the website');
    } else if (!isValidChain(chainId)) { // arthur-fox: currently this case can never happen, as chainId is set to Rinkeby
      setInfoText('We currently only support Rinkeby testnet. Please switch networks in Metamask and refresh');
    } else {
      setInfoText('BETA - this is a beta version currently running on the Rinkeby testnet.');
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
        { infoText && (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Start} alignmentHorizontal={Alignment.Center}>
            <Box variant='overlay'>
              <Text variant='error'>{infoText}</Text>
            </Box>
          </LayerContainer.Layer>
        )}
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
          <NotificationOverlay />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <ButtonsOverlay />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
          <WelcomeOverlay />
        </LayerContainer.Layer>
      </LayerContainer>
    </React.Fragment>
  );
};
