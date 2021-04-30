import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Box, Button, KibaIcon, PaddingSize, Spacing } from '@kibalabs/ui-react';

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
      <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-share' />} onClicked={onShareClicked} />
      <Spacing variant={PaddingSize.Narrow} />
      <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-cart' />} target={'https://testnets.opensea.io/collection/mdtp-test-2?embed=true'} />
      <Spacing variant={PaddingSize.Narrow} />
      <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-help' />} onClicked={onAboutClicked} />
    </Box>
  );
};
