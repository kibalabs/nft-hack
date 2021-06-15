import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Box, Direction, IconButton, KibaIcon, Stack } from '@kibalabs/ui-react';

interface ButtonsOverlayProps {
  onShareClicked: () => void;
}

export const ButtonsOverlay = (props: ButtonsOverlayProps): React.ReactElement => {
  const navigator = useNavigator();

  const onAboutClicked = () => {
    localStorage.removeItem('welcomeComplete');
    localStorage.removeItem('notificationComplete');
    navigator.navigateTo('/about');
  };

  return (
    <Box variant='overlay-topLeftCutoff'>
      <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-logo-discord' />} target={'https://discord.gg/bUeQjW4KSN'} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-share' />} onClicked={props.onShareClicked} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-cart' />} target={'https://testnets.opensea.io/collection/mdtp-test-2?embed=true'} />
        <IconButton variant={'primary'} icon={<KibaIcon iconId='ion-help' />} onClicked={onAboutClicked} />
      </Stack>
    </Box>
  );
};
