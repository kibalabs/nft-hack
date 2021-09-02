import React from 'react';

import { Alignment, Button, Direction, IconButton, KibaIcon, MultiLineInput, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

export const SharePage = (): React.ReactElement => {

  const initialShareText = 'Check this out milliondollartokenpage.com! 🤩\nIts milliondollarhomepage.com in the crypto-era! You own space on the site using #NFTs! 🤑 \nThey still have NFTs left so hurry and grab some now before they run out! 🚀'
  const [shareText, setShareText] = React.useState<string | null>(initialShareText);

  const getShareText = (): string => {
    return encodeURIComponent(shareText);
  };  

  const getShareLink = (): string => {
    return encodeURIComponent('https://milliondollartokenpage.com');
  };
  
  // const getShareSubject = (): string => {
  //   return encodeURIComponent('Check out the coolest NFT space in crypto! Own your space as NFTs powered by Ethereum.');
  // };

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Share MDTP!'}</Text>
      <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>        
        <Text alignment={TextAlignment.Center}>{'❤️ Share the love with your friends and followers! ❤️'}</Text>
        <MultiLineInput
          value={shareText}
          onValueChanged={setShareText}          
          minRowCount={5}
        />
        <Button variant='primary' text='Tweet' iconLeft={<KibaIcon iconId='ion-logo-twitter' />} target={`https://twitter.com/intent/tweet?text=${getShareText()}`} />
        <Spacing/>
        <Text alignment={TextAlignment.Center}>{'Some other options you might like!'}</Text>
        <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>          
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={`https://api.whatsapp.com/send/?phone&text=${getShareText()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-reddit' />} target={`https://www.reddit.com/submit?url=${getShareLink()}&title=${getShareText()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-mail' />} target={`mailto:%20?subject=${getShareLink()}&body=${getShareText()}`} />
        </Stack>
      </Stack>
    </Stack>
  );
};
