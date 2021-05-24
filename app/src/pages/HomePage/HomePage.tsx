import React from 'react';

import { Alignment, Box, LayerContainer, LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { BaseImage, GridItem } from '../../client';
import { ButtonsOverlay } from '../../components/ButtonsOverlay';
import { NotificationOverlay } from '../../components/NotificationOverlay';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { isValidChain } from '../../util/chainUtil';

export const HomePage = (): React.ReactElement => {
  const { chainId, contract, apiClient, network } = useGlobals();
  const [infoText, setInfoText] = React.useState<string | undefined>(undefined);
  const [gridItems, setGridItems] = React.useState<GridItem[] | undefined>(undefined);
  const [baseImage, setBaseImage] = React.useState<BaseImage | undefined>(undefined);

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    if (!network) {
      setBaseImage(undefined);
      setGridItems(undefined);
      return;
    }
    apiClient.getLatestBaseImage(network).then((retrievedBaseImage: BaseImage): void => {
      setBaseImage(retrievedBaseImage);
    });
    apiClient.listGridItems(network).then((retrievedGridItems: GridItem[]): void => {
      if (retrievedGridItems.length === 0) {
        setGridItems([]);
        return;
      }
      setGridItems(retrievedGridItems);
    });
  }, [network, apiClient]);

  React.useEffect((): void => {
    loadGridItems();
    if (!contract) {
      setInfoText('Please install Metamask to interact fully with the website');
    } else if (!isValidChain(chainId)) {
      // NOTE(arthur-fox): currently this case can never happen, as chainId is set to Rinkeby
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
        { gridItems === undefined || baseImage === undefined || network === undefined ? (
          <LoadingSpinner />
        ) : (
          <TokenGrid baseImage={baseImage} gridItems={gridItems} onGridItemClicked={onGridItemClicked} />
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
