import React from 'react';

import { Alignment, Box, Direction, IconButton, KibaIcon, PaddingSize, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

interface GridControlProps {
  zoomLevel: string;
  onZoomInClicked: () => void;
  onZoomOutClicked: () => void;
}

export const GridControl = (props: GridControlProps): React.ReactElement => {
  return (
    <Box variant='overlay-vertical-unpadded' isFullWidth={false}>
      <Stack direction={Direction.Vertical} padding={PaddingSize.None} shouldAddGutters={true} defaultGutter={PaddingSize.Narrow} childAlignment={Alignment.Center}>
        <IconButton variant='tertiary' icon={<KibaIcon iconId='ion-add' />} onClicked={props.onZoomInClicked} />
        <Text variant='smaller' alignment={TextAlignment.Center}>{props.zoomLevel}</Text>
        <IconButton variant='tertiary' icon={<KibaIcon iconId='ion-remove' />} onClicked={props.onZoomOutClicked} />
      </Stack>
    </Box>
  );
};
