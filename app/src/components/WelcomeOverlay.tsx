import React from 'react';

import { Alignment, Box, Button, Direction, IconButton, KibaIcon, LayerContainer, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface WelcomeOverlayProps {
  onCloseClicked: () => void;
  onAboutClicked: () => void;
}

export const WelcomeOverlay = (props: WelcomeOverlayProps): React.ReactElement => {
  const [overlayScreenNumber, setOverlayScreenNumber] = React.useState<number>(1);

  const onNextClicked = (): void => {
    setOverlayScreenNumber(overlayScreenNumber + 1);
  };

  const OverlayScreen1 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <LayerContainer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
          <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={props.onCloseClicked} />
        </LayerContainer.Layer>
      </LayerContainer>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Welcome!'}</Text>
      <Text alignment={TextAlignment.Center}>{'MillionDollarTokenPage is a digital content space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen2 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <LayerContainer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
          <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={props.onCloseClicked} />
        </LayerContainer.Layer>
      </LayerContainer>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Interact'}</Text>
      <Text alignment={TextAlignment.Center}>{'Zoom with the mouse or + and - buttons to see down to the pixel level. Select a token to open its token panel where you can view its details and edit it if you are the owner by connecting to Metamask.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen3 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <LayerContainer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
          <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={props.onCloseClicked} />
        </LayerContainer.Layer>
      </LayerContainer>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Trade'}</Text>
      <Text alignment={TextAlignment.Center}>{'Buy pixel blocks as NFTs on the token panel or through our marketplace found in the menu. NFT blocks that you own are stored in your Ethereum address and can be re-sold at potentially higher prices in the marketplace.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen4 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <LayerContainer>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
          <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={props.onCloseClicked} />
        </LayerContainer.Layer>
      </LayerContainer>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Share'}</Text>
      <Text alignment={TextAlignment.Center}>{'Share with your friends and followers! As the community grows so will the number of people viewing your content and the value the of your NFTs!'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen5 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Final'}</Text>
      <Text alignment={TextAlignment.Center}>{'If you are still unsure about anything click ? to learn more on our about page. Otherwise, interact, trade, share, and ₿Ξ part of making crypto history!'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-help' />} onClicked={props.onAboutClicked} />
        <Button variant={'primary'} text='Done' onClicked={props.onCloseClicked} />
      </Stack>
    </Stack>
  );

  return (
    <Box variant='overlayDialog' maxWidth='500px'>
      { overlayScreenNumber === 1 ? (
        <OverlayScreen1 />
      ) : overlayScreenNumber === 2 ? (
        <OverlayScreen2 />
      ) : overlayScreenNumber === 3 ? (
        <OverlayScreen3 />
      ) : overlayScreenNumber === 4 ? (
        <OverlayScreen4 />
      ) : overlayScreenNumber === 5 ? (
        <OverlayScreen5 />
      ) : null}
    </Box>
  );
};
