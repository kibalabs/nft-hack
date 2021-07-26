import React from 'react';

import { SubRouterOutlet, useBooleanLocalStorageState, useLocation, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, HidingView, IconButton, KibaIcon, LayerContainer, LoadingSpinner, PaddingSize, Stack } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';

import { BaseImage, GridItem } from '../../client';
import { GridControl } from '../../components/GridControl';
import { MetaMaskConnection } from '../../components/MetaMaskConnection';
import { ShareOverlay } from '../../components/ShareOverlay';
import { TokenGrid } from '../../components/TokenGrid';
import { WelcomeOverlay } from '../../components/WelcomeOverlay';
import { useGlobals } from '../../globalsContext';
import { getProductOpenseaUrl } from '../../util/chainUtil';

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
  const { apiClient, network } = useGlobals();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null>(null);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null>(null);
  const [scale, setScale] = React.useState<number>(DEFAULT_SCALE);
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState<boolean>(false);
  const [isWelcomeComplete, setIsWelcomeComplete] = useBooleanLocalStorageState('welcomeComplete');
  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);

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
  }, [loadGridItems]);

  const onTokenIdClicked = (tokenId: number) => {
    navigator.navigateTo(`/tokens/${tokenId}`);
  };

  const onCloseTokenPanelClicked = (): void => {
    navigator.navigateTo('/');
  };

  const onShareOpenClicked = (): void => {
    setIsShareDialogOpen(true);
  };

  const onShareCloseClicked = (): void => {
    setIsShareDialogOpen(false);
  };

  const onWelcomeCloseClicked = (): void => {
    setIsWelcomeComplete(true);
  };

  const onAboutClicked = () => {
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

  const onMenuClicked = (): void => {
    setIsMenuOpen(!isMenuOpen);
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
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Start} alignmentHorizontal={Alignment.Start}>
          <Stack direction={Direction.Vertical} shouldAddGutters={true} padding={PaddingSize.Default}>
            <Button variant='overlay' text='Menu' iconLeft={<KibaIcon iconId={isMenuOpen ? 'ion-close' : 'ion-menu'} />} onClicked={onMenuClicked} />
            {isMenuOpen && (
              <React.Fragment>
                <Button variant='overlay' text='About MDTP' iconLeft={<KibaIcon iconId='ion-help-circle' />} onClicked={onAboutClicked} />
                <Button variant='overlay' text='Share MDTP' iconLeft={<KibaIcon iconId='ion-share' />} onClicked={onShareOpenClicked} />
                <Button variant='overlay' text='Join Discord' iconLeft={<KibaIcon iconId='ion-logo-discord' />} target={'https://discord.gg/bUeQjW4KSN'} />
                <Button variant='overlay' text='Marketplace' iconLeft={<KibaIcon iconId='ion-cart' />} target={getProductOpenseaUrl(network) || ''} />
              </React.Fragment>
            )}
          </Stack>
        </LayerContainer.Layer>
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
        { isShareDialogOpen ? (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
            <ShareOverlay onCloseClicked={onShareCloseClicked} />
          </LayerContainer.Layer>
        ) : !isWelcomeComplete ? (
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
            <WelcomeOverlay onCloseClicked={onWelcomeCloseClicked} onAboutClicked={onAboutClicked} />
          </LayerContainer.Layer>
        ) : null}
      </LayerContainer>
    </React.Fragment>
  );
};
