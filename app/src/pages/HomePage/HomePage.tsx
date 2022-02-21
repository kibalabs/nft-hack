import React from 'react';

import { SubRouterOutlet, useBooleanLocalStorageState, useLocation, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Head, HidingView, IconButton, KibaIcon, LayerContainer, LoadingSpinner, PaddingSize, ResponsiveContainingView, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import canvasSize from 'canvas-size';

import { BaseImage, GridItem } from '../../client';
import { FomoBar } from '../../components/FomoBar';
import { GridControl } from '../../components/GridControl';
import { MetaMaskConnection } from '../../components/MetaMaskConnection';
import { TokenGrid } from '../../components/TokenGrid';
import { useGlobals } from '../../globalsContext';
import { TokenSelectionProvider } from '../../tokenSelectionContext';
import { getProductOpenseaUrl } from '../../util/chainUtil';

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const DEFAULT_SCALE = 1;

export const HomePage = (): React.ReactElement => {
  const navigator = useNavigator();
  const location = useLocation();
  const { apiClient, network, chainId, localStorageClient } = useGlobals();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [baseImage, setBaseImage] = React.useState<BaseImage | null | undefined>(undefined);
  const [scale, setScale] = React.useState<number>(DEFAULT_SCALE);
  // @ts-ignore Weird error between core and core-react
  const [isWelcomeComplete, setIsWelcomeComplete] = useBooleanLocalStorageState('welcomeComplete', localStorageClient);
  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);
  const [focussedTokenIds, setFocussedTokenIds] = React.useState<number[]>([]);
  const [maxScale, setMaxScale] = React.useState<number | undefined>(undefined);

  React.useEffect((): void => {
    canvasSize.maxArea({
      max: 1000 * MAX_SCALE,
      usePromise: true,
      step: 100,
    }).then((result: { width: number, height: number }): void => {
      const canvasMaxScale = Math.floor(Math.sqrt((result.width as unknown as number * result.height as unknown as number) / (1000 * 1000)) * 10) / 10;
      setMaxScale(canvasMaxScale);
    });
  }, []);

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

  const isTokenUpdatePanelShowing = location.pathname.includes('/tokens/') && location.pathname.endsWith('/update');
  const isTokenMintPanelShowing = location.pathname.includes('/tokens/') && location.pathname.endsWith('/mint');
  const isTokenPanelShowing = !isTokenUpdatePanelShowing && location.pathname.includes('/tokens/');
  const isAboutPanelShowing = location.pathname.includes('/about');
  const isRoadmapPanelShowing = location.pathname.includes('/roadmap');
  const isSharePanelShowing = location.pathname.includes('/share');
  const isOwnerPanelShowing = location.pathname.includes('/owners/');
  const isPanelShowing = isTokenPanelShowing || isTokenUpdatePanelShowing || isTokenMintPanelShowing || isAboutPanelShowing || isRoadmapPanelShowing || isSharePanelShowing || isOwnerPanelShowing;

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
      <Head headId='home'>
        <title>{'Million Dollar Token Page - The Homepage of the Metaverse!'}</title>
      </Head>
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
                          <Button variant='primary' text='About MDTP' iconLeft={<KibaIcon iconId='ion-help-circle' />} target={'/about'} />
                          <Button variant='primary' text='View Roadmap' iconLeft={<KibaIcon iconId='ion-map' />} target={'/roadmap'} />
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
              <LayerContainer.Layer isFullHeight={true} isFullWidth={true}>
                <Stack direction={Direction.Horizontal} isFullWidth={true} isFullHeight={true}>
                  <HidingView isHidden={!isPanelShowing}>
                    <Box isFullHeight={true} width='95vw' maxWidth='500px' />
                  </HidingView>
                  <Stack.Item shrinkFactor={1} growthFactor={1}>
                    {maxScale && (
                      <TokenGrid
                        minScale={MIN_SCALE}
                        maxScale={maxScale}
                        baseImage={baseImage}
                        newGridItems={gridItems || []}
                        tokenCount={10000}
                        onTokenIdClicked={onTokenIdClicked}
                        scale={scale}
                        onScaleChanged={setConstrainedScale}
                      />
                    )}
                  </Stack.Item>
                </Stack>
              </LayerContainer.Layer>
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
                <HidingView isHidden={!isMenuOpen}>
                  <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Narrow}>
                    <Button variant='overlay' text='About MDTP' iconLeft={<KibaIcon iconId='ion-help-circle' />} target={'/about'} />
                    <Button variant='overlay' text='View Roadmap' iconLeft={<KibaIcon iconId='ion-map' />} target={'/roadmap'} />
                    <Button variant='overlay' text='Refer a Friend' iconLeft={<KibaIcon iconId='ion-share' />} target={'/share'} />
                    <Button variant='overlay' text='Read our Blog' iconLeft={<KibaIcon iconId='ion-newspaper' />} target={'https://blog.milliondollartokenpage.com'} />
                    <Button variant='overlay' text='Join Discord' iconLeft={<KibaIcon iconId='ion-logo-discord' />} target={'https://discord.gg/bUeQjW4KSN'} />
                    <Button variant='overlay' text='Follow Twitter' iconLeft={<KibaIcon iconId='ion-logo-twitter' />} target={'https://twitter.com/mdtp_app'} />
                    <Button variant='overlay' text='Open Marketplace' iconLeft={<KibaIcon iconId='ion-cart' />} target={getProductOpenseaUrl(network || '') || ''} />
                  </Stack>
                </HidingView>
              </Stack>
            </LayerContainer.Layer>
            <LayerContainer.Layer isFullHeight={true} isFullWidth={false} alignmentHorizontal={Alignment.Start}>
              <HidingView isHidden={!isPanelShowing}>
                <Box variant='homePanel' shouldClipContent={true} isFullHeight={true} width='95vw' maxWidth='500px'>
                  <LayerContainer>
                    <LayerContainer.Layer isFullHeight={true} isFullWidth={true}>
                      <SubRouterOutlet />
                    </LayerContainer.Layer>
                    <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
                      <Box variant='panelButtonHolder'>
                        <IconButton variant='tertiary' icon={<KibaIcon iconId='ion-close' />} target={'/'} />
                      </Box>
                    </LayerContainer.Layer>
                  </LayerContainer>
                </Box>
              </HidingView>
            </LayerContainer.Layer>
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
