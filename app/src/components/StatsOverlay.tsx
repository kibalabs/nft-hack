import React from 'react';

import { Box, Direction, Stack } from '@kibalabs/ui-react';

import { NetworkSummary } from '../client';
import { useGlobals } from '../globalsContext';
import { KeyValue } from './KeyValue';

export const formatPrice = (value: number, symbol: string, symbolAtEnd: boolean): string => {
  let stringValue = String(value);
  if (value === 0) {
    stringValue = '0';
  } else if (value >= 1000000000) {
    stringValue = `${(value / 1000000000.0).toFixed(0)}B`;
  } else if (value >= 10000000) {
    stringValue = `${(value / 1000000.0).toFixed(0)}M`;
  } else if (value >= 1000000) {
    stringValue = `${(value / 1000000.0).toFixed(1)}M`;
  } else if (value >= 1000) {
    stringValue = `${(value / 1000.0).toFixed(0)}K`;
  } else if (value >= 100) {
    stringValue = `${value.toFixed(0)}`;
  } else if (value >= 10) {
    stringValue = `${value.toFixed(1)}`;
  } else if (value >= 1) {
    stringValue = `${value.toFixed(2)}`;
  } else {
    stringValue = `${value.toFixed(3)}`;
  }
  return symbolAtEnd ? `${stringValue}${symbol}` : `${symbol}${stringValue}`;
};

export const StatsOverlay = (): React.ReactElement => {
  const { apiClient, network } = useGlobals();
  const [networkSummary, setNetworkSummary] = React.useState<NetworkSummary | undefined>(undefined);

  const updateStats = React.useCallback(async (): Promise<void> => {
    apiClient.getNetworkSummary(network).then((retrievedNetworkSummary: NetworkSummary): void => {
      setNetworkSummary(retrievedNetworkSummary);
    });
  }, [apiClient, network]);

  React.useEffect((): void => {
    updateStats();
  }, [updateStats]);

  return (
    <Box variant='overlay-bottomLeftCutoff' width={'175px'}>
      {networkSummary && (
        <Stack direction={Direction.Vertical} isFullWidth={true}>
          <KeyValue
            name='Market Cap'
            value={`${formatPrice(networkSummary.marketCapitalization, 'Ξ', true)}`}
            nameTextVariant='small-bold'
            valueTextVariant='small'
          />
          <KeyValue
            name='Total sales'
            value={`${networkSummary.totalSales}`}
            nameTextVariant='small-bold'
            valueTextVariant='small'
          />
          <KeyValue
            name='Average price'
            value={`${formatPrice(networkSummary.averagePrice, 'Ξ', true)}`}
            nameTextVariant='small-bold'
            valueTextVariant='small'
          />
        </Stack>
      )}
    </Box>
  );
};
