import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Text, Box, Button, PaddingSize, Spacing, TextAlignment, Stack, Direction, Alignment } from '@kibalabs/ui-react';

export const WelcomeOverlay = (): React.ReactElement => {
  const [visible, setVisible] = React.useState<boolean | null>(false);
  const navigator = useNavigator();

  const onAboutClicked = () => {
    navigator.navigateTo('/about');
  };

  const getVisible = () => {
    return visible;
  }

  return (
    <Box variant='overlay' width='600px'>
      <Text variant='header6' alignment={TextAlignment.Center}>{'Welcome'}</Text>
      <Text variant='paragraph' alignment={TextAlignment.Center}>{'Info here...'}</Text>
      <Spacing variant={PaddingSize.Narrow}/>
      <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
        <Button variant={'primary'} text='Done' iconGutter={PaddingSize.None} onClicked={ () => setVisible(false)} />
        <Stack.Item growthFactor={0.1} />
        <Button variant={'primary'} text='More' iconGutter={PaddingSize.None} onClicked={onAboutClicked} />        
      </Stack>
    </Box>
  );
};
