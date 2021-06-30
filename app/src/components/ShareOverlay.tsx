import React from 'react';

import { Alignment, Box, Button, Direction, IconButton, KibaIcon, LayerContainer, PaddingSize, Stack, Text, TextAlignment, Image } from '@kibalabs/ui-react';

interface ShareOverlayProps {
  onCloseClicked: () => void;
}

const TWITTER_SHARE = 'https://twitter.com/intent/tweet?url=https%3A%2F%2Fmilliondollartokenpage.com&text=Check%20out%20the%20coolest%20ad%20space%20in%20crypto%21%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.';
const WHATSAPP_SHARE = 'https://api.whatsapp.com/send/?phone&text=Check%20out%20the%20coolest%20ad%20space%20in%20crypto%21%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.%20https%3A%2F%2Fmilliondollartokenpage.com&';
const REDDIT_SHARE = 'https://www.reddit.com/submit?url=https%3A//milliondollartokenpage.com&title=Check%20out%20the%20coolest%20ad%20space%20in%20crypto%21%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.';
const EMAIL_SHARE = 'mailto:%20?subject=%20&body=Check%20out%20the%20coolest%20ad%20space%20in%20crypto!%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.%0D%0Ahttps%3A%2F%2Fmilliondollartokenpage.com';

export const ShareOverlay = (props: ShareOverlayProps): React.ReactElement => {
  const [overlayScreenNumber, setOverlayScreenNumber] = React.useState<number>(1);

  const onShareClicked = (): void => {
    setOverlayScreenNumber(2);
  };

  const onLose = (): void => {
    setOverlayScreenNumber(3);
  };

  const onWin = (): void => {
    setOverlayScreenNumber(4);
  };

  const ShareScreen = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Share'}</Text>
      <Text alignment={TextAlignment.Center}>{'😊 Make sure to share us with your friends and followers! 😊'}</Text>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-twitter' />} target={TWITTER_SHARE} onClicked={onShareClicked} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={WHATSAPP_SHARE} onClicked={onShareClicked} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-reddit' />} target={REDDIT_SHARE} onClicked={onShareClicked} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-mail' />} target={EMAIL_SHARE} onClicked={onShareClicked} />
      </Stack>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'secondary'} text='Close' onClicked={props.onCloseClicked} />
      </Stack>
    </Stack>
  );

  const MiningScreen = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Thanks for sharing!'}</Text>
      <Text alignment={TextAlignment.Center}>{'One sec, we are mining for your reward... ⛏️'}</Text>
      <Image source='/assets/mining-small.gif' alternativeText={'Mining'} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'secondary'} text='Lose' onClicked={onLose} />
        <Button variant={'secondary'} text='Win' onClicked={onWin} />        
      </Stack>
    </Stack>
  );

  const LoseScreen = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Share again!'}</Text>
      <Text alignment={TextAlignment.Center}>{'You did not get a reward this time but please try again!'}</Text>
      <Image source='/assets/sad-doge-small.gif' alternativeText={'Mining'} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'secondary'} text='Close' onClicked={props.onCloseClicked} />
      </Stack>
    </Stack>
  );

  const WinScreen = (): React.ReactElement => (
    <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
      <Text variant='header2' alignment={TextAlignment.Center}>{'Congrats!'}</Text>
      <Text alignment={TextAlignment.Center}>{'Thanks for sharing, you have earned a reward from our staking pool!'}</Text>
      <Image source='/assets/win-doge-small.gif' alternativeText={'You Win!'} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
        <Button variant={'secondary'} text='Claim' onClicked={props.onCloseClicked} />
      </Stack>
    </Stack>
  );

  return (
    <Box variant='overlay' maxWidth='500px'>
      { overlayScreenNumber === 1 ? (
        <ShareScreen />
      ) : overlayScreenNumber === 2 ? (
        <MiningScreen />
      ) : overlayScreenNumber === 3 ? (
        <LoseScreen />
      ) : overlayScreenNumber === 4 ? (
        <WinScreen />
      ) : null}
    </Box>
  );
};
