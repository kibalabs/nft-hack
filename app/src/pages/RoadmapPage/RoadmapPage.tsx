import React from 'react';

import { Alignment, Direction, Markdown, PaddingSize, Stack, Text } from '@kibalabs/ui-react';


export const RoadmapPage = (): React.ReactElement => {
  const text = `
  MDTP is a community focused project. We're here for the long-haul and want to grow alongside a vibrant community! For this reason we're doing things a little differently and releasing the NFTs in tranches of 1000 NFTs at a time together with your input, all the way up to the collection's full 10,000 NFTs.

  &nbsp;

  **Open Beta - Until Monday 6th September '21 🛠️**

  We’re still in BETA so minting NFTs is literally free. Just connect to the Rinkeby testnet in your wallet and get some Rinkeby ETH for free from a [faucet](https://faucet.rinkeby.io/)!

  When we launch there'll be a mint-fee for NFTs. However, we're giving away 1 NFT free for joining the BETA, and for every 1 new person you get onto our Discord you'll get 1 extra NFT free up to a maximum of 35 NFTs!

  We're giving away up to 1000 NFTs in BETA so hurry, jump in and share with your friends and followers now!

  &nbsp;

  **Tranch 0: N tokens for 0 ETH 🐣**

  If you were a BETA user we're rewarding you with NFTs for free! We'll contact you directly on Discord when we launch to orchestrate this.

  &nbsp;

  **Tranch 1: N - 1000 tokens for 0.01 ETH 👥**

  The first 1000 tokens will have a mint fee of only 0.01 ETH each. Individual accounts can hold at most 35 NFTs to promote a varied community and deter whales.

  &nbsp;

  **Tranch 2: 1000 - 2000 tokens for ? ETH 🦍**

  For the second tranch and beyond we'll get your input on how best to release them. For example you, the community, might decide we should sell the next 1000 only to CryptoPunk or BAYC owners to try and get NFT OGs onboard! Whatever gets decided will be a community oriented decision.

  ...

  **50% of tokens sold - New Artwork and Traits**  🎨

  We’ll revamp the NFT artwork with a top artist and introduce traits - all with community involvement!

  ...

  **Final Tranch: 9500 - 10,000 tokens 🏆**

  The middle 500 blocks will have their own unique artwork and traits, and be auctioned off at the very final tranch in the fairest and most fun way possible!

  &nbsp;

  MDTP is a project focused on the exciting and emerging NFT community. We've built it using blockchain technology so that one day it can grow to outlive even us. We're looking forward to going on this journey with you. Join us and own a piece of crypto history! ❤️
  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'MDTP Roadmap'}</Text>
      <Markdown source={text} />
    </Stack>
  );
};
