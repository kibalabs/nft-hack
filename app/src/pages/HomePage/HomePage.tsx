import React from 'react';

import { SubRouterOutlet, useBooleanLocalStorageState, useLocation, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Direction, HidingView, IconButton, KibaIcon, LayerContainer, LoadingSpinner, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';

import { BaseImage, GridItem } from '../../client';
import { ButtonsOverlay } from '../../components/ButtonsOverlay';
import { ShareOverlay } from '../../components/ShareOverlay';
import { StatsOverlay } from '../../components/StatsOverlay';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { isValidChain } from '../../util/chainUtil';
import { MetaMaskConnection } from '../../components/MetaMaskConnection';
import { GridControl } from '../../components/GridControl';

const PanelLayer = styled.div`
  width: 95vw;
  max-width: 500px;
  height: 100%;
`;

const GridOffset = styled.div`
  width: 95vw;
  max-width: 500px;
`;

const MIN_SCALE = 0.5;
const MAX_SCALE = 10;
const DEFAULT_SCALE = 1;

export const HomePage = (): React.ReactElement => {
  const navigator = useNavigator();
  const location = useLocation();
  const { chainId, contract, apiClient, network } = useGlobals();
  const [infoText, setInfoText] = React.useState<string | null>(null);
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null>(null);
  const [scale, setScale] = React.useState<number>(DEFAULT_SCALE);
  console.log('scale', scale);
  const [shareDialogOpen, setShareDialogOpen] = React.useState<boolean>(false);
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

  const onCloseTokenPanelClicked = (): void => {
    navigator.navigateTo('/');
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
  const isPanelShowing = isTokenPanelShowing || isAboutPanelShowing;

  React.useEffect((): void => {
    // NOTE(krishan711): force a resize event so the grid knows to recalculate itself
    window.dispatchEvent(new Event('resize'));
  }, [isPanelShowing]);

  const constrainScale = React.useCallback((newScale: number): number => {
    return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
  }, []);

  const setConstrainedScale = React.useCallback((newScale: number | ((prevState: number) => number)): void => {
    if (typeof newScale === 'function') {
      setScale((currentScale: number): number => {
        return constrainScale(newScale(currentScale));
      });
    } else {
      setScale(constrainScale(newScale));
    }
  }, [constrainScale]);

  const onZoomInClicked = (): void => {
    setConstrainedScale(scale + 1);
  };

  const onZoomOutClicked = (): void => {
    setConstrainedScale(scale - 1);
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
                scale={scale}
                onScaleChanged={setConstrainedScale}
              />
            </Stack.Item>
          </Stack>
        )}
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <GridControl
            zoomLevel={`${Math.floor(100 * (scale / MAX_SCALE))}%`}
            onZoomInClicked={onZoomInClicked}
            onZoomOutClicked={onZoomOutClicked}
          />
        </LayerContainer.Layer>
        {/* { infoText && (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Start} alignmentHorizontal={Alignment.Center}>
            <Box variant='overlay'>
              <Text variant='error'>{infoText}</Text>
            </Box>
          </LayerContainer.Layer>
        )} */}
        {/* <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <ButtonsOverlay onShareClicked={onShareOpenClicked} />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End}>
          <StatsOverlay />
        </LayerContainer.Layer> */}
        {isPanelShowing && (
          <LayerContainer.Layer isFullHeight={true} isFullWidth={false} alignmentHorizontal={Alignment.Start}>
            <PanelLayer>
              <Box variant='homePanel' isFullHeight={true} isFullWidth={true} shouldClipContent={true}>
                <LayerContainer>
                  <LayerContainer.Layer>
                    <SubRouterOutlet />
                  </LayerContainer.Layer>
                  <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
                    <Box variant='panelButtonHolder'>
                      <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={onCloseTokenPanelClicked} />
                    </Box>
                  </LayerContainer.Layer>
                </LayerContainer>
              </Box>
            </PanelLayer>
          </LayerContainer.Layer>
        )}
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.Start}>
          <MetaMaskConnection />
        </LayerContainer.Layer>
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
