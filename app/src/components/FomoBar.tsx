import React from 'react';

import { Alignment, Box, Direction, LayerContainer, PaddingSize, Stack, Text } from '@kibalabs/ui-react';

interface IFomoBarProps {
  zoomLevel: string;
  onZoomInClicked: () => void;
  onZoomOutClicked: () => void;
}

export const FomoBar = (props: IFomoBarProps): React.ReactElement => {
  const [mintedCount, setMintedCount] = React.useState<number | undefined | null>(500);
  const [mintingLimit, setMintingLimit] = React.useState<number | undefined | null>(1000);

  const hasMintedAll = mintedCount >= 10000;
  const hasMintedAllInTranch = mintedCount >= mintingLimit;
  const barVariant = hasMintedAll ? '' : '-fomoBarPartial';
  return (
    <Box variant='fomoBar' isFullWidth={true} height={'2em'}>
      <LayerContainer>
        <LayerContainer.Layer isFullHeight={true} isFullWidth={true}>
          <Box variant={`fomoBarFill${barVariant}`} isFullHeight={true} width={`${100 * mintedCount/mintingLimit}%`} maxWidth='100%' />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={true} isFullWidth={true}>
          <Stack direction={Direction.Horizontal} isFullHeight={true} isFullWidth={true} contentAlignment={Alignment.Center} childAlignment={Alignment.Center} paddingVertical={PaddingSize.Default} shouldAddGutters={true}>
            { hasMintedAll ? (
              <Text variant='light-bold-small-uppercase'>{`All tokens sold 🤩`}</Text>
            ) : hasMintedAllInTranch ? (
              <Text variant='light-bold-small-uppercase'>{`All available tokens sold, more coming soon 👀`}</Text>
            ) : (
              <Text variant='light-bold-small-uppercase'>{`${mintingLimit - mintedCount} / ${mintingLimit} tokens still available`}</Text>
            )}
          </Stack>
        </LayerContainer.Layer>
      </LayerContainer>
    </Box>
  );
};
