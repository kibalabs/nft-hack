import React from 'react';

import { Alignment, Direction, Markdown, PaddingSize, Stack, Text } from '@kibalabs/ui-react';


export const RoadmapPage = (): React.ReactElement => {
  const text = `
  **Release Schedule**

  MDTP is a community focused project. We're here for the long-haul and want to grow this digital content space alongside a vibrant community. For this exact reason we've decided to do things a little differently and not release all NFTs in one go. Instead we plan to release the NFTs in tranches of 1000 NFTs each, all the way up to the full 10,000 NFTs.
  
  # Tranch 0: N tokens for 0 ETH 🐣
  
  If you were a beta tester we're rewarding you with your mainnet tokens for free! We'll contact you directly on Discord when we're on mainnet to orchestrate this.
  
  # Tranch 1 : N - 2000 tokens for 0.01 ETH 👥
  
  The first tranch will go up to the first 2000 tokens and have a mint fee of only 0.01 ETH each. Individual accounts will be able to mint at most 50 NFTs in one go to promote a varied community of owners and deter whales from engaging in harmful behaviour towards the project.
  
  # Tranch 2 : 2000 - 3000 tokens for ? ETH 🦍
  
  For the second tranch and beyond we wish to have community input on how best to release them in order to create the sort of community that you wish to have. As an example, you the community might decide we should sell the next 1000 only to Cryptopunk or BAYC owners as they believe it will create the most hype. Whatever we decide it will be a community oriented decision.
  
  ...
  
  # Final Tranch : 9500 - 10,000 tokens 🏆
  
  The middle 500 blocks will be a space that the MDTP team will use creatively to keep the community engaged and at the as the very final tranch we'll auction them off in a traditional English style auction where the highest bidder will take the blocks. By this point we hope that the community is engaged and excited about the release of these final most central blocks. We'll ensure that the auction is conducted in the fairest and most fun way possible!
  
  MDTP is a project focused on the exciting and emerging NFT community. We've built it using blockchain technology so that one day it may grow to live beyond us. We're looking forward to going on this journey with you! ❤️
  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Million Dollar Token Page'}</Text>
      <Markdown source={text} />
    </Stack>
  );
};
