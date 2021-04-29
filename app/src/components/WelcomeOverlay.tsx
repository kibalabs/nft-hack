import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Text, Box, Button, PaddingSize, Spacing, TextAlignment, Stack, Direction, Alignment } from '@kibalabs/ui-react';

interface WelcomeOverlayProps {
  setVisible(visible: boolean): void;
}

export const WelcomeOverlay = (props: WelcomeOverlayProps): React.ReactElement => {
  const navigator = useNavigator();

  const onAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  return (
    <Box variant='overlay' width='500px'>
      <Text variant='header6' alignment={TextAlignment.Center}>{'Welcome!'}</Text>
      <Spacing variant={PaddingSize.Wide}/>
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'We are excited to have you here, if its your first time then click More and we will show you around. If you already know how everything works then just click Done and have fun exploring. =)'}</Text>
      <Spacing variant={PaddingSize.Wide}/>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Done' iconGutter={PaddingSize.None} onClicked={ () => {props.setVisible(false)} }/>
        <Stack.Item growthFactor={0.1} />
        <Button variant={'primary'} text='More' iconGutter={PaddingSize.None} onClicked={onAboutClicked} />        
      </Stack>
    </Box>
  );
};
