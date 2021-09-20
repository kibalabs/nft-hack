import React from 'react';

import { Alignment, Direction, Markdown, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';

import { ShareForm } from '../../components/ShareForm';

export const SharePage = (): React.ReactElement => {
  const initialShareText = 'Frens, just found this site milliondollartokenpage.com @mdtp_app where you show off your JPGs and own the space as an NFT. Probably nothing fren but gonna Ape in. WGMI! 🚀';

  const referralText = `
  🤑 Referral Program - Make money referring friends! 🤑

  ✅ Reward: 20% of mint-fee to referee + referrer on up to 30 NFTs

  1️⃣ Friend follows Twitter + joins Discord discord.gg/bUeQjW4KSN

  2️⃣ Friend mints NFT on MDTP and updates content
  
  3️⃣ Inform admins on Discord with proof
  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Share MDTP'}</Text>
      <Markdown source={referralText} />
      <Spacing />
      <ShareForm initialShareText={initialShareText} minRowCount={4} shouldShowAllOptions={true} />
    </Stack>
  );
};
