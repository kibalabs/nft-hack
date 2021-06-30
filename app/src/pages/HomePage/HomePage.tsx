import React from 'react';

import { useBooleanLocalStorageState, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Direction, HidingView, IconButton, KibaIcon, LayerContainer, LoadingSpinner, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Outlet, useLocation } from 'react-router';
import styled from 'styled-components';

import { BaseImage, GridItem } from '../../client';
import { ButtonsOverlay } from '../../components/ButtonsOverlay';
import { ShareOverlay } from '../../components/ShareOverlay';
import { StatsOverlay } from '../../components/StatsOverlay';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { isValidChain } from '../../util/chainUtil';
import { TokenPage } from '../TokenPage/TokenPage';

const PanelLayer = styled.div`
  width: 95vw;
  max-width: 500px;
  height: 100%;
`;

const GridOffset = styled.div`
  width: 95vw;
  max-width: 500px;
`;

const MIN_SCALE = 1;
const MAX_SCALE = 10;

export const HomePage = (): React.ReactElement => {
  const navigator = useNavigator();
  const location = useLocation();
  const { chainId, contract, apiClient, network } = useGlobals();
  const [infoText, setInfoText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState<boolean>(false);
  const [welcomeComplete, setWelcomeComplete] = useBooleanLocalStorageState('welcomeComplete');
  const [featuredToken, setFeaturedToken] = React.useState<string>('');

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

    if (welcomeComplete) {
      displayFeaturedToken();
    }
  }, [welcomeComplete, network, apiClient]);

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

  const displayFeaturedToken = () => {
    // TODO: Get stakingTokens and tokenWeights from an API function
    const stakingTokens = ['3729', '6421', '2443', '4969', '197', '5929', '4886', '1729'];
    const tokenWeights = [300, 1000, 300, 400, 100, 550, 300, 800];
    const totalWeights = tokenWeights.reduce((a, b) => a + b, 0);
    const randomNumber = Math.floor(Math.random() * (totalWeights + 1));
    let index = 0; let
      acc = 0;
    for (; index < tokenWeights.length; index += 1) {
      acc += tokenWeights[index];
      if (randomNumber < acc) break;
    }
    const selectedIndex = stakingTokens[index];
    setFeaturedToken(selectedIndex.toString());
  };

  const onTokenIdClicked = (tokenId: number) => {
    navigator.navigateTo(`/tokens/${tokenId}`);
    setFeaturedToken('');
  };

  const onCloseSidePanelClicked = (): void => {
    navigator.navigateTo('/');
    setFeaturedToken('');
  };

  const onShareOpenClicked = (): void => {
    setShareDialogOpen(true);
  };

  const onShareCloseClicked = (): void => {
    setShareDialogOpen(false);
  };

  const onWelcomeCloseClicked = (): void => {
    setWelcomeComplete(true);
  };

  const onWelcomeAboutClicked = (): void => {
    navigator.navigateTo('/about');
  };

  const isTokenPanelShowing = location.pathname.includes('/tokens/');
  const isAboutPanelShowing = location.pathname.includes('/about');
  const isFeaturedPanelShowing = featuredToken.length > 0 && !(isTokenPanelShowing || isAboutPanelShowing);
  const isPanelShowing = isTokenPanelShowing || isAboutPanelShowing || isFeaturedPanelShowing;

  React.useEffect((): void => {
    // NOTE(krishan711): force a resize event so the grid knows to recalculate itself
    window.dispatchEvent(new Event('resize'));
  }, [isPanelShowing]);

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      <LayerContainer>
        { baseImage === null ? (
          <LoadingSpinner />
        ) : (
          <Stack direction={Direction.Horizontal} isFullWidth={true} isFullHeight={true}>
            <HidingView isHidden={!isPanelShowing}>
              <GridOffset />
            </HidingView>
            <Stack.Item shrinkFactor={1} growthFactor={1}>
              <TokenGrid
                minScale={MIN_SCALE}
                maxScale={MAX_SCALE}
                baseImage={baseImage}
                newGridItems={gridItems || []}
                tokenCount={10000}
                onTokenIdClicked={onTokenIdClicked}
              />
            </Stack.Item>
          </Stack>
        )}
        { infoText && (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Start} alignmentHorizontal={Alignment.Center}>
            <Box variant='overlay'>
              <Text variant='error'>{infoText}</Text>
            </Box>
          </LayerContainer.Layer>
        )}
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <ButtonsOverlay onShareClicked={onShareOpenClicked} />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End}>
          <StatsOverlay />
        </LayerContainer.Layer>
        {isPanelShowing && (
          <LayerContainer.Layer isFullHeight={true} isFullWidth={false} alignmentHorizontal={Alignment.Start}>
            <PanelLayer>
              <Box variant='homePanel' isFullHeight={true} isFullWidth={true} shouldClipContent={true}>
                <LayerContainer>
                  <LayerContainer.Layer>
                    {isFeaturedPanelShowing ? (
                      <TokenPage tokenId={featuredToken} isFeatured={true} />
                    ) : (
                      <Outlet />
                    )}
                  </LayerContainer.Layer>
                  <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
                    <Box variant='panelButtonHolder'>
                      <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={onCloseSidePanelClicked} />
                    </Box>
                  </LayerContainer.Layer>
                </LayerContainer>
              </Box>
            </PanelLayer>
          </LayerContainer.Layer>
        )}
        { shareDialogOpen ? (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
            <ShareOverlay onCloseClicked={onShareCloseClicked} />
          </LayerContainer.Layer>
        ) : !welcomeComplete ? (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
            <WelcomeOverlay onCloseClicked={onWelcomeCloseClicked} onAboutClicked={onWelcomeAboutClicked} />
          </LayerContainer.Layer>
        ) : null}
      </LayerContainer>
    </React.Fragment>
  );
};
