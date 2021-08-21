import React from 'react';

import { useInterval, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Direction, LayerContainer, LinkBase, PaddingSize, Stack, Text } from '@kibalabs/ui-react';
import { BigNumber } from 'ethers';

import { NetworkStatus } from '../client';
import { useGlobals } from '../globalsContext';


export const FomoBar = (): React.ReactElement => {
  const navigator = useNavigator();
  const { contract, apiClient, network } = useGlobals();
  const [mintedCount, setMintedCount] = React.useState<number | undefined | null>(undefined);
  const [mintingLimit, setMintingLimit] = React.useState<number | undefined | null>(undefined);
  const [randomAvailableTokenId, setRandomAvailableTokenId] = React.useState<number | undefined | null>(undefined);

  const updateData = React.useCallback((): void => {
    if (!network || !apiClient) {
      return;
    }
    if (contract) {
      contract.totalMintLimit().then((retrievedTotalMintLimit: number): void => {
        setMintingLimit(retrievedTotalMintLimit);
      });
      contract.mintedCount().then((retrievedMintedCount: BigNumber): void => {
        setMintedCount(retrievedMintedCount.toNumber());
      });
    }
    apiClient.getNetworkStatus(network).then((networkStatus: NetworkStatus): void => {
      if (!contract) {
        setMintedCount(networkStatus.mintCount);
        setMintingLimit(networkStatus.mintLimit);
      }
      setRandomAvailableTokenId(networkStatus.randomAvailableTokenId);
    });
  }, [apiClient, network, contract]);

  React.useEffect((): void => {
    updateData();
  }, [updateData]);

  useInterval(1000, (): void => {
    updateData();
  });

  const onMintClicked = (): void => {
    navigator.navigateTo(`/tokens/${randomAvailableTokenId}/mint`);
  };

  const hasMintedAll = mintedCount ? mintedCount >= 10000 : false;
  const hasMintedAllInTranch = mintedCount && mintingLimit ? mintedCount >= mintingLimit : false;
  const remainingCount = mintedCount && mintingLimit ? mintingLimit - mintedCount : 0;
  const progress = mintedCount && mintingLimit ? mintedCount / mintingLimit : 0;
  const barVariant = hasMintedAll ? '' : '-fomoBarPartial';
  return (
    <Box variant='fomoBar' isFullWidth={true} height={'2em'}>
      <LayerContainer>
        <LayerContainer.Layer isFullHeight={true} isFullWidth={true}>
          <Box variant={`fomoBarFill${barVariant}`} isFullHeight={true} width={`${100 * progress}%`} maxWidth='100%' />
        </LayerContainer.Layer>
        <LayerContainer.Layer isFullHeight={true} isFullWidth={true}>
          <Stack direction={Direction.Horizontal} isFullHeight={true} isFullWidth={true} contentAlignment={Alignment.Center} childAlignment={Alignment.Center} paddingVertical={PaddingSize.Default} shouldAddGutters={true}>
            {mintedCount == null || mintingLimit == null ? (
              <Text variant='light-bold-small-uppercase'>{'Loading stats...'}</Text>
            ) : hasMintedAll ? (
              <Text variant='light-bold-small-uppercase'>{'All tokens sold 🤩'}</Text>
            ) : hasMintedAllInTranch ? (
              <Text variant='light-bold-small-uppercase'>{'All available tokens sold, more coming soon 👀'}</Text>
            ) : (
              <LinkBase onClicked={onMintClicked} isEnabled={randomAvailableTokenId != null}>
                <Text variant='light-bold-small-uppercase'>{`${remainingCount} / ${mintingLimit} tokens available. Mint one now 🌟`}</Text>
              </LinkBase>
            )}
          </Stack>
        </LayerContainer.Layer>
      </LayerContainer>
    </Box>
  );
};
