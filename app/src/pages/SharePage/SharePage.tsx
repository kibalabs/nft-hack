import React from 'react';

import { Alignment, Direction, IconButton, KibaIcon, LayerContainer, Markdown, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

const getShareText = (): string => {
  return encodeURIComponent('Check these guys out milliondollartokenpage.com! 🤩\nIts milliondollarhomepage.com in the crypto-era! You own space on the site using #NFTs! 🤑 \nThey still have NFTs left so hurry and grab some now before they run out! 🚀');
};

const getShareLink = (): string => {
  return encodeURIComponent('https://milliondollartokenpage.com');
};

const getShareSubject = (): string => {
  return encodeURIComponent('Check out the coolest digital content space in crypto! Own your space as NFTs powered by Ethereum.');
};

export const SharePage = (): React.ReactElement => {
  const text = `
  MDTP is a community focused project. We're here for the long-haul and want to grow alongside a vibrant community! For this reason we're doing things a little differently and releasing the NFTs in tranches of 1000 NFTs at a time together with your input, all the way up to the collection's full 10,000 NFTs.

  &nbsp;

  **Open Beta - Until Monday 6th September '21 🛠️**

  We’re still in BETA so minting NFTs is literally free. Just connect to the Rinkeby testnet in your wallet and get some Rinkeby ETH for free from a [faucet](https://faucet.rinkeby.io/)!

  When we launch there'll be a mint-fee for NFTs. However, we're giving away 1 NFT free for joining the BETA, and for every 1 new person you get onto our Discord you'll get 1 extra NFT free up to a maximum of 35 NFTs!

  We're giving away up to 1000 NFTs in BETA so hurry, jump in and share with your friends and followers now!
  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Share!'}</Text>
      <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>        
        <Text alignment={TextAlignment.Center}>{'❤️ Share the love with your friends and followers! ❤️'}</Text>
        <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-twitter' />} target={`https://twitter.com/intent/tweet?text=${getShareText()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-whatsapp' />} target={`https://api.whatsapp.com/send/?phone&text=${getShareText()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-logo-reddit' />} target={`https://www.reddit.com/submit?url=${getShareLink()}&title=${getShareSubject()}`} />
          <IconButton variant='primary' icon={<KibaIcon iconId='ion-mail' />} target={`mailto:%20?subject=${getShareSubject()}&body=${getShareText()}`} />
        </Stack>
      </Stack>
      {/* <Markdown source={text} /> */}
    </Stack>
  );
};
