import React from 'react';

import { Alignment, Box, Button, Direction, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface ShareOverlayProps {
  onCloseClicked: () => void;
  // onClaimClicked: () => void;
}

export const ShareOverlay = (props: ShareOverlayProps): React.ReactElement => {
  return (
    <Box variant='overlay' maxWidth='500px'>
      <Stack direction={Direction.Vertical} shouldAddGutters={true} defaultGutter={PaddingSize.Wide} padding={PaddingSize.Wide}>
        <Text variant='header2' alignment={TextAlignment.Center}>{'Share'}</Text>
        <Text alignment={TextAlignment.Center}>{'<TwitterIcon>'}</Text>
        <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
          <Button variant={'secondary'} text='Close' onClicked={props.onCloseClicked} />
          {/* <Button variant={'primary'} text='Claim' target='https://fec48oyedt9.typeform.com/to/kzsI48jo' onClicked={props.onClaimClicked} /> */}
        </Stack>
      </Stack>
    </Box>
  );
};
