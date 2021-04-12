import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, KibaIcon, PaddingSize, Stack } from '@kibalabs/ui-react';

export const AboutIcon = (): React.ReactElement => {
  const navigator = useNavigator();

  const onAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  return (
    <Stack direction={Direction.Horizontal} contentAlignment={Alignment.End}>
      <Box variant='aboutOverlay'>
        <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-help' />} onClicked={onAboutClicked} />
      </Box>
    </Stack>
  );
};
