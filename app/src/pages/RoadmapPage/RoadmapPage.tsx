import React from 'react';

import { Alignment, Direction, Markdown, PaddingSize, Stack, Text } from '@kibalabs/ui-react';


export const RoadmapPage = (): React.ReactElement => {
  const text = `
  **Release Schedule**

  MDTP is a community focused project. We're here for the long-haul and want to grow this digital content space alongside with a vibrant community. For this exact reason we've decided to do things a little differently and not release all NFTs in one go. Instead we plan to release the NFTs in tranches of 1000 NFTs each, all the way up to the full 10,000 NFTs.
  
  # Tranch 0: N tokens for 0 ETH
  
  If you were a beta tester we're rewarding you with your mainnet tokens for free! We'll contact you directly when we're on mainnet in order to 
  
  # Tranch 1 : 1000 - N tokens for 0.01 ETH
  
  The first tranch will have a mint fee of only 0.01 ETH each and individual accounts will be able to mint at most 30 NFTs in one go to promote a variety of owners and deter whales from dumping on the project.
  
  For the second tranch and beyond we wish to have community input on how best to release them in order to create the sort of community that you wish to have. As an example, you the community might decide we should sell the next 1000 only to Cryptopunk or BAYC owners as you believe it will create the most hype. 
  
  Whatever we decide it will be a community oriented decision. We're looking forward to going on this journey with you!
  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Million Dollar Token Page'}</Text>
      <Markdown source={text} />
    </Stack>
  );
};
