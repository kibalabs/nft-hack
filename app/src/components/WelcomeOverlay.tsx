import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Text, Box, Button, KibaIcon, PaddingSize, Spacing } from '@kibalabs/ui-react';

export const WelcomeOverlay = (): React.ReactElement => {
  const navigator = useNavigator();

  const onAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  return (
    <Box variant='overlay'>
      <Text variant='heading2'>{'Welcome'}</Text>
      <Text variant={'paragraph'}>{'Info here...'}</Text>
      <Spacing variant={PaddingSize.Narrow} />
      <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-help' />} onClicked={onAboutClicked} />
    </Box>
  );
};
