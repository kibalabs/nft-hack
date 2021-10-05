import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Image, LinkBase, Stack, Text } from '@kibalabs/ui-react';

import { useAccountIds, useAccounts, useOnLinkAccountsClicked } from '../accountsContext';
import { GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { isUpdated } from '../util/gridItemUtil';


export const MetaMaskConnection = (): React.ReactElement => {
  const navigator = useNavigator();
  const { network, apiClient } = useGlobals();
  const accounts = useAccounts();
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

  const onConnectClicked = async (): Promise<void> => {
    await onLinkAccountsClicked();
  };

  const onClicked = (): void => {
    if (accountIds && accountIds.length > 0) {
      navigator.navigateTo(`/lords/${accountIds[0]}`);
    }
  };

  const boxVariantSuffix = hasNonUpdatedGridItems ? '-overlayError' : (gridItems && gridItems.length > 0) ? '-overlaySuccess' : '';

  return (
    <LinkBase onClicked={onClicked}>
      <Box variant={`overlay-horizontal${boxVariantSuffix}`} isFullWidth={false}>
        { !accounts ? (
          <Button
            variant='primary'
            text='Install Metamask'
            target='https://metamask.io'
          />
        ) : accounts.length === 0 ? (
          <Button
            variant={'primary'}
            text='Connect accounts'
            onClicked={onConnectClicked}
          />
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
            <Text variant='note'>{`${accounts.length} connected ${accounts.length > 1 ? 'accounts' : 'account'}`}</Text>
            {/* <Text variant='note'>{`(${network})`}</Text> */}
            {hasNonUpdatedGridItems && (
              <Text variant='note-error'>Update tokens now</Text>
            )}
          </Stack>
        )}
      </Box>
    </LinkBase>
  );
};
