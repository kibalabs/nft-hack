import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Direction, Image, LinkBase, Stack, Text } from '@kibalabs/ui-react';

import { useAccountIds, useOnLinkAccountsClicked } from '../accountsContext';
import { GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { isUpdated } from '../util/gridItemUtil';


export const MetaMaskConnection = (): React.ReactElement => {
  const navigator = useNavigator();
  const { network, apiClient } = useGlobals();
  const accountIds = useAccountIds();
  const onLinkAccountsClicked = useOnLinkAccountsClicked();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [hasNonUpdatedGridItems, setHasNonUpdatedGridItems] = React.useState<boolean>(false);

  const loadTokens = React.useCallback(async (): Promise<void> => {
    if (network === null || accountIds === null) {
      setGridItems(null);
      return;
    }
    setGridItems(undefined);
    if (network === undefined || accountIds === undefined) {
      return;
    }
    const groupedGridItems = await Promise.all(accountIds.map(async (accountId: string): Promise<GridItem[]> => {
      return apiClient.listGridItems(network, true, accountId);
    }));
    const allGridItems = groupedGridItems.reduce((accumulator: GridItem[], current: GridItem[]): GridItem[] => {
      return accumulator.concat(current);
    }, []);
    setGridItems(allGridItems);
    setHasNonUpdatedGridItems(allGridItems.filter((gridItem: GridItem): boolean => !isUpdated(gridItem)).length > 0);
  }, [accountIds, network, apiClient]);

  React.useEffect((): void => {
    loadTokens();
  }, [loadTokens]);

  const onClicked = async (): Promise<void> => {
    if (!accountIds) {
      window.open('https://metamask.io');
    } else if (accountIds.length === 0) {
      await onLinkAccountsClicked();
    } else {
      navigator.navigateTo(`/owners/${accountIds[0]}`);
    }
  };

  const boxVariantSuffix = hasNonUpdatedGridItems ? '-overlayError' : (gridItems && gridItems.length > 0) ? '-overlaySuccess' : '';

  return (
    <LinkBase onClicked={onClicked}>
      <Box variant={`overlay-horizontal${boxVariantSuffix}`} isFullWidth={false}>
        { !accountIds ? (
          <Text variant='bold'>Install metamask to get started</Text>
        ) : accountIds.length === 0 ? (
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
