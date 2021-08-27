import React from 'react';

import { Alignment, Box, Direction, IconButton, KibaIcon, LayerContainer, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface ShareOverlayProps {
  onCloseClicked: () => void;
}

const getShareText = (): string => {
  return encodeURIComponent(`Check these guys out milliondollartokenpage.com! 🤩\nIts milliondollarhomepage.com in the crypto-era! You own space on the site using #NFTs! 🤑 \nThey still have NFTs left so hurry and grab some now before they run out! 🚀`);
};

const getShareLink = (): string => {
  return encodeURIComponent('https://milliondollartokenpage.com');
};

const getShareSubject = (): string => {
  return encodeURIComponent('Check out the coolest digital content space in crypto! Own your space as NFTs powered by Ethereum.');
};

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
        <Text alignment={TextAlignment.Center}>{'❤️ Share the love with your friends and followers! ❤️'}</Text>
        <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-twitter' />} target={`https://twitter.com/intent/tweet?text=${getShareText()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={`https://api.whatsapp.com/send/?phone&text=${getShareText()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-reddit' />} target={`https://www.reddit.com/submit?url=${getShareLink()}&title=${getShareSubject()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-mail' />} target={`mailto:%20?subject=${getShareSubject()}&body=${getShareText()}`} />
        </Stack>
      </Stack>
    </Box>
  );
};
