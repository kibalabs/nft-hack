import React from 'react';

import { Alignment, Box, Direction, IconButton, KibaIcon, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface GridControlProps {
  zoomLevel: string;
  onZoomInClicked: () => void;
  onZoomOutClicked: () => void;
}

export const GridControl = (props: GridControlProps): React.ReactElement => {
  return (
    <Box variant='overlay-bottomRightCutoff'>
      <Stack direction={Direction.Horizontal} padding={PaddingSize.None} shouldAddGutters={true} childAlignment={Alignment.Center}>
        <IconButton variant='secondary' icon={<KibaIcon iconId='ion-remove' />} onClicked={props.onZoomOutClicked} />
        <Box width='2.5em'>
          <Text variant='paragraph' alignment={TextAlignment.Center}>{props.zoomLevel}</Text>
        </Box>
        <IconButton variant='secondary' icon={<KibaIcon iconId='ion-add' />} onClicked={props.onZoomInClicked} />
      </Stack>
    </Box>
  );
};
