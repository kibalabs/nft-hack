import React from 'react';

import { Alignment, Box, Direction, IconButton, KibaIcon, LayerContainer, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface ShareOverlayProps {
  onCloseClicked: () => void;
}

const TWITTER_SHARE = 'https://twitter.com/intent/tweet?url=https%3A%2F%2Fmilliondollartokenpage.com&text=Check%20out%20the%20coolest%20ad%20space%20in%20crypto%21%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.';
const WHATSAPP_SHARE = 'https://api.whatsapp.com/send/?phone&text=Check%20out%20the%20coolest%20ad%20space%20in%20crypto%21%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.%20https%3A%2F%2Fmilliondollartokenpage.com&';
const REDDIT_SHARE = 'https://www.reddit.com/submit?url=https%3A//milliondollartokenpage.com&title=Check%20out%20the%20coolest%20ad%20space%20in%20crypto%21%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.';
const EMAIL_SHARE = 'mailto:%20?subject=%20&body=Check%20out%20the%20coolest%20ad%20space%20in%20crypto!%20Own%20your%20ads%20as%20NFTs%20powered%20by%20Ethereum.%0D%0Ahttps%3A%2F%2Fmilliondollartokenpage.com';

export const ShareOverlay = (props: ShareOverlayProps): React.ReactElement => {
  return (
    <Box variant='overlayDialog' maxWidth='500px'>
      <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
        <LayerContainer>
          <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentHorizontal={Alignment.End} alignmentVertical={Alignment.Start}>
            <IconButton variant={'secondary'} icon={<KibaIcon iconId='ion-close' />} onClicked={props.onCloseClicked} />
          </LayerContainer.Layer>
        </LayerContainer>
        <Text variant='header2' alignment={TextAlignment.Center}>{'Share'}</Text>
        <Text alignment={TextAlignment.Center}>{'😊 Make sure to share us with your friends and followers! 😊'}</Text>
        <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
          <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-twitter' />} target={TWITTER_SHARE} />
          <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={WHATSAPP_SHARE} />
          <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-reddit' />} target={REDDIT_SHARE} />
          <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-mail' />} target={EMAIL_SHARE} />
        </Stack>
      </Stack>
    </Box>
  );
};
