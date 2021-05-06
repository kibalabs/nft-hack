import React from 'react';

import { Box, PaddingSize, Spacing, Text } from '@kibalabs/ui-react';

import { StatItem } from '../client';
import { useGlobals } from '../globalsContext';

export const StatsOverlay = (): React.ReactElement => {
  const { mdtpClient } = useGlobals();
  const [marketCap, setMarketCap] = React.useState<string>('0');
  const [totalSales, setTotalSales] = React.useState<string>('0');
  const [averagePrice, setAveragePrice] = React.useState<string>('0');

  const updateStats = React.useCallback(async (): Promise<void> => {
    mdtpClient.listStatItems().then((retrievedStatItems: StatItem[]): void => {
      for (let i = 0; i < retrievedStatItems.length; i += 1) {
        if (retrievedStatItems[i].title === 'market_cap') setMarketCap(retrievedStatItems[i].data);
        if (retrievedStatItems[i].title === 'total_sales') setTotalSales(retrievedStatItems[i].data);
        if (retrievedStatItems[i].title === 'average_price') setAveragePrice(retrievedStatItems[i].data);
      }
    });
  }, [mdtpClient]);

  React.useEffect((): void => {
    updateStats();
  }, [updateStats]);

  return (
    <Box variant='overlay-bottomLeftCutoff' width={'200px'}>
      <Text variant='header6'>{'Stats'}</Text>
      <Text variant='paragraph'>{'Market Cap:'}</Text>
      <Text variant='italic'>{`${marketCap}Ξ ($?M)`}</Text>
      <Text variant='paragraph'>{'Total sales:'}</Text>
      <Text variant='italic'>{`${totalSales}`}</Text>
      <Text variant='paragraph'>{'Average price:'}</Text>
      <Text variant='italic'>{`${averagePrice}Ξ ($?)`}</Text>
      <Spacing variant={PaddingSize.Narrow} />
    </Box>
  );
};
