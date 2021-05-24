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
import { useBooleanLocalStorageState, useNavigator } from '@kibalabs/core-react';

export const HomePage = (): React.ReactElement => {
  const navigator = useNavigator();
  const { chainId, contract, apiClient, network } = useGlobals();
  const [infoText, setInfoText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null>(null);
  const [notificationComplete, setNotificationComplete] = useBooleanLocalStorageState('notificationComplete')
  const [welcomeComplete, setWelcomeComplete] = useBooleanLocalStorageState('welcomeComplete')

  const loadGridItems = React.useCallback(async (): Promise<void> => {
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

  const onWelcomeCloseClicked = (): void => {
    setWelcomeComplete(true);
  }

  const onWelcomeAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  const onNotificationCloseClicked = (): void => {
    setNotificationComplete(true);
  }

  const onNotificationClaimClicked = () => {
    setNotificationComplete(true);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      <LayerContainer>
        { gridItems === null || baseImage === null ? (
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
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <ButtonsOverlay />
        </LayerContainer.Layer>
        {!welcomeComplete ? (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
            <WelcomeOverlay onCloseClicked={onWelcomeCloseClicked} onAboutClicked={onWelcomeAboutClicked} />
          </LayerContainer.Layer>
        ) : !notificationComplete ? (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
            <NotificationOverlay onCloseClicked={onNotificationCloseClicked} onClaimClicked={onNotificationClaimClicked} />
          </LayerContainer.Layer>
        ) : null}
      </LayerContainer>
    </React.Fragment>
  );
};
