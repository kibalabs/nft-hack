import React from 'react';

import { Alignment, Box, Button, Direction, IconButton, KibaIcon, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface WelcomeOverlayProps {
  onCloseClicked: () => void;
  onAboutClicked: () => void;
}

export const WelcomeOverlay = (props: WelcomeOverlayProps): React.ReactElement => {
  const [overlayScreenNumber, setOverlayScreenNumber] = React.useState<number>(1);

  const onNextClicked = (): void => {
    setOverlayScreenNumber(overlayScreenNumber + 1);
  }

  const OverlayScreen1 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Welcome!'}</Text>
      <Text alignment={TextAlignment.Center}>{'We are excited to have you here, if its your first time then click More and we will show you around. If you already know how everything works then just click Done and have fun exploring =)'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'secondary'} text='Close' onClicked={props.onCloseClicked} />
        <Button variant={'primary'} text='More' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen2 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'MillionDollarTokenPage'}</Text>
      <Text alignment={TextAlignment.Center}>{'Is a digital advertising space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen3 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Interact'}</Text>
      <Text alignment={TextAlignment.Center}>{'Zoom with the mouse or + and - buttons to see down to the pixel level. Select a token to go to its token page, where you can view its details and edit it if you own it and have your Metamask account connected.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen4 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Trade'}</Text>
      <Text alignment={TextAlignment.Center}>{'Buy pixel blocks as NFTs through our marketplace by selecting the cart symbol. NFT blocks that you own are stored in your Ethereum address and can be re-sold at potentially higher prices in the marketplace.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen5 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Share'}</Text>
      <Text alignment={TextAlignment.Center}>{'Share with your friends and attach your Ethereum address to get 10% kickback on any purchase that they make. So if they buy an NFT for $100 then you get $10 back for recommending.'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'primary'} text='Next' onClicked={onNextClicked} />
      </Stack>
    </Stack>
  );

  const OverlayScreen6 = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Final'}</Text>
      <Text alignment={TextAlignment.Center}>{'If you are still unsure about anything click ? to learn more on our about page. Otherwise, interact, trade, share, and be a part of making crypto history!'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-help' />} onClicked={props.onAboutClicked} />
        <Button variant={'primary'} text='Done' onClicked={props.onCloseClicked} />
      </Stack>
    </Stack>
  );

  return (
    <Box variant='overlay' maxWidth='500px'>
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
      ) : overlayScreenNumber === 6 ? (
        <OverlayScreen6 />
      ) : null}
    </Box>
  );
};
