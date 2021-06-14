import React from 'react';

import { useBooleanLocalStorageState, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, IconButton, KibaIcon, LayerContainer, LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Outlet, useLocation } from 'react-router';
import styled from 'styled-components';

import { BaseImage, GridItem } from '../../client';
import { ButtonsOverlay } from '../../components/ButtonsOverlay';
import { NotificationOverlay } from '../../components/NotificationOverlay';
import { StatsOverlay } from '../../components/StatsOverlay';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { isValidChain } from '../../util/chainUtil';

const TokenLayer = styled.div`
  width: 95vw;
  max-width: 550px;
  height: 100%;
`;

export const HomePage = (): React.ReactElement => {
  const navigator = useNavigator();
  const location = useLocation();
  const { chainId, contract, apiClient, network } = useGlobals();
  const [infoText, setInfoText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null>(null);
  const [notificationComplete, setNotificationComplete] = useBooleanLocalStorageState('notificationComplete');
  const [welcomeComplete, setWelcomeComplete] = useBooleanLocalStorageState('welcomeComplete');

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    if (network === null) {
      return;
    }
    apiClient.getLatestBaseImage(network).then((retrievedBaseImage: BaseImage): void => {
      setBaseImage(retrievedBaseImage);
      apiClient.listGridItems(network, true, retrievedBaseImage.generatedDate).then((retrievedGridItems: GridItem[]): void => {
        setGridItems(retrievedGridItems);
      });
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

  const onTokenIdClicked = (tokenId: number) => {
    navigator.navigateTo(`/tokens/${tokenId}`);
  };

  const onCloseTokenPanelClicked = () => {
    navigator.navigateTo('/');
  };

  const onWelcomeCloseClicked = (): void => {
    setWelcomeComplete(true);
  };

  const onWelcomeAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  const onNotificationCloseClicked = (): void => {
    setNotificationComplete(true);
  };

  const onNotificationClaimClicked = () => {
    setNotificationComplete(true);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      <LayerContainer>
        { baseImage === null ? (
          <LoadingSpinner />
        ) : (
          <TokenGrid baseImage={baseImage} newGridItems={gridItems || []} tokenCount={10000} onTokenIdClicked={onTokenIdClicked} />
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
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End}>
          <StatsOverlay />
        </LayerContainer.Layer>
        {location.pathname.includes('/tokens/') && (
          <LayerContainer.Layer isFullHeight={true} isFullWidth={false} alignmentHorizontal={Alignment.Start}>
            <TokenLayer>
              <Box variant='homePanel' isFullHeight={true} isFullWidth={true} shouldClipContent={true}>
                <LayerContainer>
                  <LayerContainer.Layer>
                    <Outlet />
                  </LayerContainer.Layer>
                  <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
                    <Box variant='panelButtonHolder'>
                      <IconButton icon={<KibaIcon iconId='ion-close' />} onClicked={onCloseTokenPanelClicked} />
                    </Box>
                  </LayerContainer.Layer>
                </LayerContainer>
              </Box>
            </TokenLayer>
          </LayerContainer.Layer>
        )}
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
