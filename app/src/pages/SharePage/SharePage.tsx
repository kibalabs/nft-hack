import React from 'react';

import { Alignment, Direction, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';

import { ShareForm } from '../../components/ShareForm';

export const SharePage = (): React.ReactElement => {
  const initialShareText = 'Fren, just found this site milliondollartokenpage.com where you can show off your JPGs and own the space as an NFT. Probably nothing fren but gonna Ape in. WGMI! 🚀';

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Share MDTP'}</Text>
      <Spacing />
      <ShareForm initialShareText={initialShareText} minRowCount={4} isAllOptionsEnabled={true} />
    </Stack>
  );
};
