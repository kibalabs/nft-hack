import React from 'react';

import { Alignment, Direction, Head, Image, LinkBase, Markdown, PaddingSize, Stack, Text } from '@kibalabs/ui-react';


export const RoadmapPage = (): React.ReactElement => {
  const firstText = `
MDTP is a community focused project. We're here for the long-haul and want to grow alongside a vibrant community, join [our discord](https://discord.com/invite/bUeQjW4KSN) if you haven't already 🚀🚀

For this reason we're doing things a little differently. We're releasing the NFTs in batches of 1000 NFTs at a time.

Together with your input, we'll iteratively launch the batches all the way up to the collection's full 10,000 NFTs.

Click the image below to view our roadmap. We will keep it up to date as we progress through the batches. We'd love to hear your thoughts and what you're excited to see from MDTP 🔥🔥
  `;
  //   const text = `
  // **Batch 0 (Pre-launch): ~150 tokens for 0 ETH 🐣**

  // If you were a BETA user before our launch on Monday 6th September '21 we rewarded you with free NFTs! This was all done through our Discord and we're glad to say it went very well 🔥

  // **Batch 1 (Launch): 150 - 1000 tokens for 0.01 ETH 👥**

  // The first 1000 tokens will have a mint fee of only 0.01 ETH each. Individual accounts can hold at most 35 NFTs to promote a varied community and deter whales.

  // **Batch 2: 1000 - 2000 tokens for 0.01 ETH 🦍**

  // For the second batch and beyond we'll get your input on how best to release them. For example you, the community, might decide we should sell the next 1000 only to CryptoPunk or BAYC owners to try and get NFT OGs onboard! Whatever gets decided will be a community oriented decision.

  // **Batch 3: 2000 - 3000 tokens for ?? ETH**  🎨

  // ... (lots more to come) ...
  // We’ll revamp the NFT artwork with a top artist and introduce traits - all with community involvement!

  // ... (lots more to come) ...

  // **Final Batch: 9500 - 10,000 tokens 🏆**

  // The middle 500 blocks will have their own unique artwork and traits, and be auctioned off at the very final batch in the fairest and most fun way possible!

  // MDTP is a project focused on the exciting and emerging NFT community. We've built it using blockchain technology so that one day it can grow to outlive even us. We're looking forward to going on this journey with you. Join us and own a piece of crypto history! ❤️
  //   `;

  return (
    <React.Fragment>
      <Head headId='roadmap'>
        <title>{'Roadmap | Million Dollar Token Page'}</title>
      </Head>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
        <Text variant='header1'>{'MDTP Roadmap'}</Text>
        <Markdown source={firstText} />
        <LinkBase target='https://milliondollartokenpage.com/assets/roadmap.png'>
          <Image source='/assets/roadmap.png' alternativeText='Roadmap image' />
        </LinkBase>
        {/* <Markdown source={text} /> */}
      </Stack>
    </React.Fragment>
  );
};
