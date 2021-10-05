import React from 'react';

import { SubRouterOutlet, useBooleanLocalStorageState, useLocation, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, HidingView, IconButton, KibaIcon, LayerContainer, LoadingSpinner, PaddingSize, ResponsiveContainingView, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';

import { BaseImage, GridItem } from '../../client';
import { FomoBar } from '../../components/FomoBar';
import { GridControl } from '../../components/GridControl';
import { MetaMaskConnection } from '../../components/MetaMaskConnection';
import { TokenGrid } from '../../components/TokenGrid';
import { useGlobals } from '../../globalsContext';
import { TokenSelectionProvider } from '../../tokenSelectionContext';
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
  const { apiClient, network, chainId } = useGlobals();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null | undefined>(undefined);
  const [scale, setScale] = React.useState<number>(DEFAULT_SCALE);
  const [isWelcomeComplete, setIsWelcomeComplete] = useBooleanLocalStorageState('welcomeComplete');
  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);
  const [focussedTokenIds, setFocussedTokenIds] = React.useState<number[]>([]);

  const loadGridItems = React.useCallback(async (): Promise<void> => {
    if (network === null) {
      setGridItems(null);
      setBaseImage(null);
      return;
    }
    setGridItems(undefined);
    setBaseImage(undefined);
    if (network === undefined) {
      return;
    }
    apiClient.getLatestBaseImage(network).then((retrievedBaseImage: BaseImage): void => {
      setBaseImage(retrievedBaseImage);
      apiClient.listGridItems(network, true, undefined, retrievedBaseImage.generatedDate).then((retrievedGridItems: GridItem[]): void => {
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

  const onAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  const onRoadmapClicked = () => {
    navigator.navigateTo('/roadmap');
  };

  const onShareClicked = (): void => {
    navigator.navigateTo('/share');
  };

  const isTokenUpdatePanelShowing = location.pathname.includes('/tokens/') && location.pathname.endsWith('/update');
  const isTokenMintPanelShowing = location.pathname.includes('/tokens/') && location.pathname.endsWith('/mint');
  const isTokenPanelShowing = !isTokenUpdatePanelShowing && location.pathname.includes('/tokens/');
  const isAboutPanelShowing = location.pathname.includes('/about');
  const isRoadmapPanelShowing = location.pathname.includes('/roadmap');
  const isSharePanelShowing = location.pathname.includes('/share');
  const isLordPanelShowing = location.pathname.includes('/lords/');
  const isPanelShowing = isTokenPanelShowing || isTokenUpdatePanelShowing || isTokenMintPanelShowing || isAboutPanelShowing || isRoadmapPanelShowing || isSharePanelShowing || isLordPanelShowing;

  React.useEffect((): void => {
    // NOTE(krishan711): force a resize event so the grid knows to recalculate itself
    window.dispatchEvent(new Event('resize'));

    if (!isWelcomeComplete) {
      setIsWelcomeComplete(true);
      navigator.navigateTo('/about');
    }
  }, [isPanelShowing, isWelcomeComplete, setIsWelcomeComplete, navigator]);

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

  React.useEffect((): void => {
    if (!isPanelShowing && focussedTokenIds.length > 0) {
      setFocussedTokenIds([]);
    }
  }, [isPanelShowing, focussedTokenIds]);

  return (
    <TokenSelectionProvider tokenSelection={focussedTokenIds} setTokenSelection={setFocussedTokenIds}>
      <Helmet>
        <title>{'Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true}>
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <LayerContainer>
            { network === undefined || baseImage === undefined ? (
              <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Center} alignmentHorizontal={Alignment.Center}>
                <LoadingSpinner />
              </LayerContainer.Layer>
            ) : network === null || baseImage === null ? (
              <LayerContainer.Layer isFullHeight={false} alignmentVertical={Alignment.Center}>
                <ResponsiveContainingView sizeResponsive={{ base: 11, small: 8, medium: 6, large: 6 }}>
                  <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} shouldAddGutters={true}>
                    { chainId !== null ? (
                      <React.Fragment>
                        <Text variant='header2' alignment={TextAlignment.Center}>Hi crypto fan 👋</Text>
                        <Spacing />
                        <Text alignment={TextAlignment.Center}>Good to have you here!</Text>
                        <Text alignment={TextAlignment.Center}>You’re on a chain we don’t recognize. Please switch your wallet to &quot;Ethereum Mainnet&quot;. You can choose this at the top of the MetaMask dropdown.</Text>
                        <Spacing />
                        <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} shouldAddGutters={true}>
                          <Button variant='primary' text='About MDTP' iconLeft={<KibaIcon iconId='ion-help-circle' />} onClicked={onAboutClicked} />
                          <Button variant='primary' text='View Roadmap' iconLeft={<KibaIcon iconId='ion-map' />} onClicked={onRoadmapClicked} />
                        </Stack>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <Text variant='header2' alignment={TextAlignment.Center}>Something&apos;s not right here 🤦‍♂️</Text>
                        <Spacing />
                        <Text alignment={TextAlignment.Center}>We&apos;re so embarrassed. Something has stopped us from loading the gorgeous page you so wanted to see. The best we can do right now is to ask you to refresh and try again whilst we dry off our tears and figure out what&apos;s happened here. Thanks!</Text>
                      </React.Fragment>
                    )}
                  </Stack>
                </ResponsiveContainingView>
              </LayerContainer.Layer>
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
                    <Button variant='overlay' text='View Roadmap' iconLeft={<KibaIcon iconId='ion-map' />} onClicked={onRoadmapClicked} />
                    <Button variant='overlay' text='Refer a Friend' iconLeft={<KibaIcon iconId='ion-share' />} onClicked={onShareClicked} />
                    <Button variant='overlay' text='Join Discord' iconLeft={<KibaIcon iconId='ion-logo-discord' />} target={'https://discord.gg/bUeQjW4KSN'} />
                    <Button variant='overlay' text='Follow Twitter' iconLeft={<KibaIcon iconId='ion-logo-twitter' />} target={'https://twitter.com/mdtp_app'} />
                    <Button variant='overlay' text='Open Marketplace' iconLeft={<KibaIcon iconId='ion-cart' />} target={getProductOpenseaUrl(network || '') || ''} />
                  </React.Fragment>
                )}
              </Stack>
            </LayerContainer.Layer>
            <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} />
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
          </LayerContainer>
        </Stack.Item>
        <FomoBar />
      </Stack>
    </TokenSelectionProvider>
  );
};
