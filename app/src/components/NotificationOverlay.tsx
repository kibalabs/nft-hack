import React from 'react';

import { Alignment, Box, Button, Direction, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

export const NotificationOverlay = (): React.ReactElement => {
  const [visible, setVisible] = React.useState<boolean>(true);

  const onClaimClicked = () => {
    setVisible(false);
    window.open('https://fec48oyedt9.typeform.com/to/kzsI48jo', '_blank');
  };

  return (
    <>
      { visible && (
        <Box variant='overlay' width='300px' height='200px'>
          <Spacing variant={PaddingSize.Wide} />
          <Text variant='header6' alignment={TextAlignment.Center}>{'Notification'}</Text>
          <Spacing variant={PaddingSize.Wide} />
          <Text variant='paragraph' alignment={TextAlignment.Center}>{'We are giving away FREE tokens during BETA, click to claim!'}</Text>
          <Spacing variant={PaddingSize.Wide} />
          <Stack direction={Direction.Horizontal} contentAlignment={Alignment.Center}>
            <Button variant={'primary'} text='Claim' iconGutter={PaddingSize.None} onClicked={onClaimClicked} />
            <Stack.Item growthFactor={0.1} />
            <Button variant={'primary'} text='Hide' iconGutter={PaddingSize.None} onClicked={() => setVisible(false)} />
          </Stack>
        </Box>
      )}
    </>
  );
};
