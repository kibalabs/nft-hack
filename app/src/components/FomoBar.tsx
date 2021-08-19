import React from 'react';

import { Box, Text } from '@kibalabs/ui-react';

interface IFomoBarProps {
  zoomLevel: string;
  onZoomInClicked: () => void;
  onZoomOutClicked: () => void;
}

export const FomoBar = (props: IFomoBarProps): React.ReactElement => {
  return (
    <Box variant='fomoBar' isFullWidth={true}>
      <Text variant='light-bold-uppercase'>hello world</Text>
    </Box>
  );
};
