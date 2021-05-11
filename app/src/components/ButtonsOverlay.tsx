import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Box, Direction, IconButton, KibaIcon, Stack } from '@kibalabs/ui-react';

export const ButtonsOverlay = (): React.ReactElement => {
  const navigator = useNavigator();

  const onAboutClicked = () => {
    localStorage.removeItem('welcomeComplete');
    navigator.navigateTo('/about');
  };

  const onShareClicked = () => {
    navigator.navigateTo('/about');
  };

  return (
    <Box variant='overlay-topLeftCutoff'>
      <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-discord' />} target={'https://discord.gg/ffRPTSj2'} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-share' />} onClicked={onShareClicked} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-cart' />} target={'https://testnets.opensea.io/collection/mdtp-test-2?embed=true'} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-help' />} onClicked={onAboutClicked} />        
      </Stack>
    </Box>
  );
};
