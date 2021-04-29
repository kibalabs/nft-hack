import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, KibaIcon, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

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
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'Is a digital advertising space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market.'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Next' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(3) } />
      </Stack>      
    </>
  );

  const OverlayScreen3 = (): React.ReactElement => (
    <>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='header6' alignment={TextAlignment.Center}>{'Interact'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'Zoom with the mouse or + and - buttons to see down to the pixel level and select a token to go to its own personal page, where you can view owner details or edit those you own once connected to Metamask.'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Next' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(4) } />
      </Stack>      
    </>
  );

  const OverlayScreen4 = (): React.ReactElement => (
    <>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='header6' alignment={TextAlignment.Center}>{'Trade'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'Buy pixel blocks as NFTs through our marketplace by selecting the cart symbol. NFT blocks that you own are stored in your Ethereum address and can be re-sold at potentially higher prices on the secondary market.'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Next' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(5) } />
      </Stack>      
    </>
  );

  const OverlayScreen5 = (): React.ReactElement => (
    <>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='header6' alignment={TextAlignment.Center}>{'Share'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'Share us with your friends and attach your Ethereum address to get 10% kickback on any purchase that they make. So if they buy an NFT for $100 then you get $10 back for recommending.'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Next' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(6) } />
      </Stack>      
    </>
  );

  const OverlayScreen6 = (): React.ReactElement => (
    <>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='header6' alignment={TextAlignment.Center}>{'Final'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'If you are still unsure about anything select ? for more on our about page. Otherwise, interact, trade and share, and be a part of making crypto history!'}</Text>
      <Spacing variant={PaddingSize.Wide} />
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Done' iconGutter={PaddingSize.None} onClicked={ () => setOverlayScreenNumber(0) } />
        <Stack.Item growthFactor={0.1} />
        <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-help' />} onClicked={onAboutClicked} />
      </Stack>      
    </>
  );

  const OverlayScreen = (): React.ReactElement => {
    if (overlayScreenNumber === 1) return <OverlayScreen1 />;
    if (overlayScreenNumber === 2) return <OverlayScreen2 />;
    if (overlayScreenNumber === 3) return <OverlayScreen3 />;
    if (overlayScreenNumber === 4) return <OverlayScreen4 />;
    if (overlayScreenNumber === 5) return <OverlayScreen5 />;
    if (overlayScreenNumber === 6) return <OverlayScreen6 />;
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
