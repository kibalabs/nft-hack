import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Direction, Image, LinkBase, Stack, Text } from '@kibalabs/ui-react';

import { useAccount, useOnLinkAccountsClicked } from '../accountsContext';
import { GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { isUpdated } from '../util/gridItemUtil';


export const MetaMaskConnection = (): React.ReactElement => {
  const navigator = useNavigator();
  const { network, apiClient } = useGlobals();
  const account = useAccount();
  const onLinkAccountsClicked = useOnLinkAccountsClicked();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [hasNonUpdatedGridItems, setHasNonUpdatedGridItems] = React.useState<boolean>(false);

  const loadTokens = React.useCallback(async (): Promise<void> => {
    setGridItems(undefined);
    if (network === undefined || account === undefined) {
      return;
    }
    if (network === null || account === null) {
      setGridItems(null);
      return;
    }
    const allGridItems = await apiClient.listGridItems(network, true, account.address);
    setGridItems(allGridItems);
    setHasNonUpdatedGridItems(allGridItems.filter((gridItem: GridItem): boolean => !isUpdated(gridItem)).length > 0);
  }, [account, network, apiClient]);

  React.useEffect((): void => {
    loadTokens();
  }, [loadTokens]);

  const onClicked = async (): Promise<void> => {
    if (account === null) {
      window.open('https://metamask.io');
    } else if (account === undefined) {
      await onLinkAccountsClicked();
    } else {
      navigator.navigateTo(`/owners/${account.address}`);
    }
  };

  const boxVariantSuffix = hasNonUpdatedGridItems ? '-overlayError' : (gridItems && gridItems.length > 0) ? '-overlaySuccess' : '';

  return (
    <LinkBase onClicked={onClicked}>
      <Box variant={`overlayView-horizontal${boxVariantSuffix}`} isFullWidth={false}>
        { account === null ? (
          <Text variant='bold'>Install metamask to get started</Text>
        ) : account === undefined ? (
          <Text variant='bold'>Connect accounts to get started</Text>
        ) : (
          <Stack
            direction={Direction.Horizontal}
            shouldAddGutters={true}
            childAlignment={Alignment.Center}
            contentAlignment={Alignment.Center}
          >
            <Box height='15px' width='15px'>
              <Image source='/assets/connected.svg' alternativeText={'Connected indicator'} />
            </Box>
            {hasNonUpdatedGridItems ? (
              <Text variant='note-error'>Update your tokens</Text>
            ) : (
              <Text variant='note'>Your connected account</Text>
            )}
          </Stack>
        )}
      </Box>
    </LinkBase>
  );
};
