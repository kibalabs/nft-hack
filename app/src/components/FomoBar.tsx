import React from 'react';

import { useInterval, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Direction, LayerContainer, LinkBase, PaddingSize, Stack, Text } from '@kibalabs/ui-react';
import { BigNumber } from 'ethers';

import { NetworkStatus } from '../client';
import { useGlobals } from '../globalsContext';
import { isMobile } from '../util/browserUtil';

const BATCH1_DATE = new Date(Date.UTC(2021, 8, 5, 16, 0));
const BATCH1_LIMIT = 1000;
const BATCH2_DATE = new Date(Date.UTC(2021, 9, 18, 13, 0));
const BATCH2_LIMIT = 2000;

export const FomoBar = (): React.ReactElement => {
  const navigator = useNavigator();
  const { contract, apiClient, network } = useGlobals();
  const [mintedCount, setMintedCount] = React.useState<number | undefined | null>(undefined);
  const [mintingLimit, setMintingLimit] = React.useState<number | undefined | null>(undefined);
  const [randomAvailableTokenId, setRandomAvailableTokenId] = React.useState<number | undefined | null>(undefined);
  const [countdownTime, setCountdownTime] = React.useState<string | undefined | null>(undefined);
  const isRunningOnMobile = React.useMemo((): boolean => isMobile(), []);

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

  useInterval(60, (): void => {
    updateData();
  });

  const onMintClicked = (): void => {
    navigator.navigateTo(`/tokens/${randomAvailableTokenId}/mint`);
  };

  const onNextBatchClicked = (): void => {
    navigator.navigateTo('/about');
  };

  const hasMintedAll = mintedCount ? mintedCount >= 10000 : false;
  const hasMintedAllInTranch = mintedCount && mintingLimit ? mintedCount >= mintingLimit : false;
  const remainingCount = mintedCount && mintingLimit ? mintingLimit - mintedCount : 0;
  const progress = mintedCount && mintingLimit ? mintedCount / mintingLimit : 0;
  const barVariant = hasMintedAll ? '' : '-fomoBarPartial';

  const getDateDifferenceString = React.useCallback((date1: Date, date2: Date): string => {
    const difference = date1.getTime() - date2.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    if (isRunningOnMobile) {
      return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
    }
    return `${days} days, ${hours} hours, ${minutes} mins, ${seconds} secs`;
  }, [isRunningOnMobile]);

  useInterval(1, () => {
    if (!mintedCount || hasMintedAll || !hasMintedAllInTranch) {
      setCountdownTime(null);
      return;
    }
    if (mintedCount < BATCH1_LIMIT) {
      setCountdownTime(getDateDifferenceString(BATCH1_DATE, new Date()));
    } else if (mintedCount < BATCH2_LIMIT) {
      setCountdownTime(getDateDifferenceString(BATCH2_DATE, new Date()));
    } else {
      setCountdownTime(null);
    }
  });

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
            ) : countdownTime ? (
              <LinkBase onClicked={onNextBatchClicked} isEnabled={randomAvailableTokenId != null}>
                <Text variant='light-bold-small-uppercase'>{`Next batch releasing in ${countdownTime} ⏳`}</Text>
              </LinkBase>
            ) : hasMintedAllInTranch ? (
              <LinkBase onClicked={onNextBatchClicked} isEnabled={randomAvailableTokenId != null}>
                <Text variant='light-bold-small-uppercase'>{'All available tokens sold, more coming soon 👀'}</Text>
              </LinkBase>
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
