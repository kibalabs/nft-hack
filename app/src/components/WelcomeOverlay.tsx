import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

export const WelcomeOverlay = (): React.ReactElement => {
  const [overlayScreenNumber, setOverlayScreenNumber] = React.useState<number>(1);

  const navigator = useNavigator();
  const onAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  const OverlayScreen1 = (): React.ReactElement => (
    <>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='header6' alignment={TextAlignment.Center}>{'Welcome!'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'We are excited to have you here, if its your first time then click More and we will show you around. If you already know how everything works then just click Done and have fun exploring. =)'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='More' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(2) } />
        <Stack.Item growthFactor={0.1} />
        <Button variant={'primary'} text='Done' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(0) } />
      </Stack>
    </>
  );

  const OverlayScreen2 = (): React.ReactElement => (
    <>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='header6' alignment={TextAlignment.Center}>{'Milliondollartokenpage'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'We provide a digital advertising space powered by the cryptocurrency network Ethereum and NFTs. Each pixel block you see can be purchased as a unique NFT, updated with your info, and later re-sold on the secondary-market.'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Next' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(3) } />
      </Stack>
      {/* <Button variant={'primary'} text='More' iconGutter={PaddingSize.None} onClicked={onAboutClicked} /> */}
    </>
  );

  const OverlayScreen = (): React.ReactElement => {
    if (overlayScreenNumber === 1) return <OverlayScreen1 />;
    if (overlayScreenNumber === 2) return <OverlayScreen2 />;
    setOverlayScreenNumber(0);
    return <></>;
  };

  return (
    <>
      { overlayScreenNumber > 0 && (
        <Box variant='overlay' width='500px' height='230px'>
          <OverlayScreen />
        </Box>
      )}
    </>
  );
};
