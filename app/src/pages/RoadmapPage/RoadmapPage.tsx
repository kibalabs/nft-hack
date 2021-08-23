import React from 'react';

import { Alignment, Direction, Markdown, PaddingSize, Stack, Text } from '@kibalabs/ui-react';


export const RoadmapPage = (): React.ReactElement => {
  const text = `

  MDTP is a community focused project. We're here for the long-haul and want to grow this digital content space alongside a vibrant community. For this reason we've decided to do things a little differently and not release all NFTs in one go. Instead we plan to release the NFTs in tranches of 1000 NFTs each, all the way up to the full 10,000 NFTs in the collection.
  
  We’re still in BETA so minting NFTs is literally free, you just need to connect to the Rinkeby testnet in your wallet and get some Rinkeby ETH which you can get for free from a [faucet](https://faucet.rinkeby.io/)! 
  
  When we move over to mainnet you’ll actually need to pay for those NFTs. However, we'll give you 1 NFT free just for joining the BETA, and for every 1 new person you get onto our Discord we’ll let you have 1 free up to a maximum of 40 NFTs! 
  
  We're giving away up to a maximum of 2000 NFTs in BETA so make sure to share with your friends now!

  &nbsp;

  **Tranch 0: N tokens for 0 ETH 🐣**
  
  If you were a BETA user we're rewarding you with your mainnet tokens for free! We'll contact you directly on Discord when we're on mainnet to orchestrate this.
  
  &nbsp;

  **Tranch 1: N - 2000 tokens for 0.01 ETH 👥**
  
  The first tranch will go up to the first 2000 tokens and have a mint fee of only 0.01 ETH each. Individual accounts will be able to mint at most 40 NFTs in one go to promote a varied community of owners and deter whales from engaging in harmful behaviour towards the project.
  
  &nbsp;

  **Tranch 2: 2000 - 3000 tokens for ? ETH 🦍**
  
  For the second tranch and beyond we wish to have community input on how best to release them in order to create the sort of community that you wish to have. As an example you, the community, might decide we should sell the next 1000 only to CryptoPunk or BAYC owners as you believe it will create the most hype. Whatever we decide it will be a community oriented decision.
  
  ...
  
  &nbsp;

  **Final Tranch: 9500 - 10,000 tokens 🏆**
  
  The middle 500 blocks will be a space that the MDTP team will use creatively to keep the community engaged and as the very final tranch we'll auction them off. We hope that you'll be as excited about the release of these final and most central blocks as we are. We'll ensure that the auction is conducted in the fairest and most fun way possible!
  
  &nbsp;

  MDTP is a project focused on the exciting and emerging NFT community. We've built it using blockchain technology so that one day it can grow to outlive us. We're looking forward to going on this journey with you. Let's make crypto history! ❤️
  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'MDTP Roadmap'}</Text>
      <Markdown source={text} />
    </Stack>
  );
};
