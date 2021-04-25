import React from 'react';

import { Box, Direction, IconButton, KibaIcon, PaddingSize, Stack, Text } from "@kibalabs/ui-react"

interface GridControlProps {
  onZoomInClicked: () => void;
  onZoomOutClicked: () => void;
}

export const GridControl = (props: GridControlProps): React.ReactElement => {

  return (
    <Stack direction={Direction.Horizontal} padding={PaddingSize.Default} shouldAddGutters={true}>
      <IconButton icon={<KibaIcon iconId='ion-add' />} onClicked={props.onZoomInClicked} />
      <IconButton icon={<KibaIcon iconId='ion-remove' />} onClicked={props.onZoomOutClicked} />
    </Stack>
  );
}
