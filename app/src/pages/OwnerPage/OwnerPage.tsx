import React from 'react';

import { truncateMiddle } from '@kibalabs/core';
import { useNavigator, useStringRouteParam } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Head, Image, KibaIcon, List, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

import { useAccount, useWeb3 } from '../../accountsContext';
import { GridItem, NetworkStatus } from '../../client';
import { OwnedGridItemView } from '../../components/OwnedGridItemView';
import { useGlobals } from '../../globalsContext';
import { useSetTokenSelection } from '../../tokenSelectionContext';
import { getAccountEtherscanUrl, normalizeAddress } from '../../util/chainUtil';

interface GridItemGroup {
  groupId: string | null;
  startTokenId: number;
  gridItems: GridItem[];
}

export const OwnerPage = (): React.ReactElement => {
  const ownerId = normalizeAddress(useStringRouteParam('ownerId'));
  const navigator = useNavigator();
  const { apiClient, network } = useGlobals();
  const account = useAccount();
  const web3 = useWeb3();
  const setTokenSelection = useSetTokenSelection();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [gridItemGroups, setGridItemGroups] = React.useState<GridItemGroup[] | null | undefined>(undefined);
  const [ownerName, setOwnerName] = React.useState<string | null | undefined>(undefined);
  const [randomAvailableTokenId, setRandomAvailableTokenId] = React.useState<number | undefined | null>(undefined);

  const loadTokens = React.useCallback(async (): Promise<void> => {
    if (network === null) {
      setGridItemGroups(null);
      return;
    }
    if (ownerId === null) {
      return;
    }
    setGridItemGroups(undefined);
    if (network === undefined) {
      return;
    }
    apiClient.listGridItems(network, true, ownerId).then((retrievedGridItems: GridItem[]): void => {
      setGridItems(retrievedGridItems);
      const groupedGridItems = retrievedGridItems.reduce((accumulator: GridItemGroup[], gridItem: GridItem): GridItemGroup[] => {
        if (!gridItem.groupId) {
          accumulator.push({ groupId: null, startTokenId: gridItem.tokenId, gridItems: [gridItem] });
        } else {
          let matchingItem = accumulator.find((groupedGridItem: GridItemGroup): boolean => groupedGridItem.groupId === gridItem.groupId);
          if (!matchingItem) {
            matchingItem = { groupId: gridItem.groupId, startTokenId: 10000, gridItems: [] };
            accumulator.push(matchingItem);
          }
          matchingItem.startTokenId = Math.min(matchingItem.startTokenId, gridItem.tokenId);
          matchingItem.gridItems.push(gridItem);
        }
        return accumulator;
      }, []);
      const sortedGridItemGroups = groupedGridItems.sort((gridItemGroup1: GridItemGroup, gridItemGroup2: GridItemGroup): number => {
        return gridItemGroup1.startTokenId - gridItemGroup2.startTokenId;
      });
      setGridItemGroups(sortedGridItemGroups);
      const allTokenIds = retrievedGridItems.map((gridItem: GridItem): number => gridItem.tokenId);
      setTokenSelection(allTokenIds);
    });
  }, [ownerId, network, apiClient, setTokenSelection]);

  React.useEffect((): void => {
    loadTokens();
  }, [loadTokens]);

  const loadOwnerName = React.useCallback(async (): Promise<void> => {
    setOwnerName(undefined);
    if (!web3 || !ownerId) {
      setOwnerName(null);
      return;
    }
    const retrievedOwnerName = await web3.lookupAddress(ownerId);
    setOwnerName(retrievedOwnerName);
  }, [ownerId, web3]);

  React.useEffect((): void => {
    loadOwnerName();
  }, [loadOwnerName]);

  const updateData = React.useCallback((): void => {
    if (!network || !apiClient) {
      return;
    }
    apiClient.getNetworkStatus(network).then((networkStatus: NetworkStatus): void => {
      setRandomAvailableTokenId(networkStatus.randomAvailableTokenId);
    });
  }, [apiClient, network]);

  React.useEffect((): void => {
    updateData();
  }, [updateData]);

  const isOwnerUser = Boolean(ownerId && account?.address === ownerId);
  const ownerIdString = ownerId ? (ownerName || truncateMiddle(ownerId, 10)) : null;

  const onTokenIdClicked = (startTokenId: string): void => {
    navigator.navigateTo(`/tokens/${startTokenId}`);
  };

  return (
    <React.Fragment>
      <Head headId='owner'>
        <title>{`${ownerId}'s Tokens | Million Dollar Token Page`}</title>
      </Head>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        { ownerId === null ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <Text variant='error'>Invalid owner address passed. Please go back and try again.</Text>
          </React.Fragment>
        ) : network === undefined || gridItems === undefined || gridItemGroups === undefined ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : network === null || gridItems === null || gridItemGroups === null ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Stack isFullWidth={true} direction={Direction.Horizontal} contentAlignment={Alignment.Center} childAlignment={Alignment.Center} shouldAddGutters={true}>
              <Box height='2em' width='2em'>
                <Image source={`https://web3-images-api.kibalabs.com/v1/accounts/${ownerId}/image`} alternativeText='Owner Profile Picture' />
              </Box>
              <Text variant='header2' alignment={TextAlignment.Center}>{isOwnerUser ? 'Your Tokens' : `${ownerIdString}'s Tokens`}</Text>
            </Stack>
            {gridItems.length === 0 ? (
              <Text alignment={TextAlignment.Center}>{'No tokens owned'}</Text>
            ) : (
              <Text alignment={TextAlignment.Center}>{`Lord of ${gridItems.length} tokens`}</Text>
            )}
            <Button variant='invisibleNote' text={'View on etherscan'} iconRight={<KibaIcon variant='small' iconId='ion-open-outline' />} target={getAccountEtherscanUrl(network, ownerId) || ''} />
            <Spacing />
            <List isFullWidth={true} onItemClicked={onTokenIdClicked}>
              {gridItemGroups.map((gridItemGroup: GridItemGroup): React.ReactElement => (
                <List.Item variant='unpadded' key={gridItemGroup.startTokenId} itemKey={String(gridItemGroup.startTokenId)}>
                  <OwnedGridItemView gridItems={gridItemGroup.gridItems} startTokenId={gridItemGroup.startTokenId} isOwner={isOwnerUser} />
                </List.Item>
              ))}
            </List>
            {isOwnerUser && randomAvailableTokenId && (
              <Button variant='primary' isFullWidth={true} text='Mint another token' target={`/tokens/${randomAvailableTokenId}/mint`} />
            )}
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
