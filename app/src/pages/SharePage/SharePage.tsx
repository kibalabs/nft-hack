import React from 'react';

import { Alignment, Direction, Head, Markdown, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';

import { ShareForm } from '../../components/ShareForm';

export const SharePage = (): React.ReactElement => {
  const initialShareText = 'Frens, just found this site https://MillionDollarTokenPage.com @tokenpagexyz where you show off your jpegs and own the space as an NFT. Probably nothing, but gonna Ape in... LFG 🚀🚀';

  const referralText = `
**Get FREE NFTs referring friends!** 🤑

✅ Reward: 1 FREE airdropped NFT for every 4 NFTs a friend mints

1️⃣ Friend follows Twitter + joins Discord.

2️⃣ Friend mints 4 NFTs on MDTP and sets content.

3️⃣ Inform admins on Discord with proof.
  `;

  return (
    <React.Fragment>
      <Head headId='share'>
        <title>{'Share | Million Dollar Token Page'}</title>
      </Head>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
        <Text variant='header1'>{'Refer a Friend'}</Text>
        <Markdown source={referralText} />
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <Spacing />
        </Stack.Item>
        <ShareForm initialShareText={initialShareText} minRowCount={4} />
      </Stack>
    </React.Fragment>
  );
};
