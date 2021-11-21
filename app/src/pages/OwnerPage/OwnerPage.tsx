import React from 'react';

import { truncateMiddle } from '@kibalabs/core';
import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Head, Image, KibaIcon, List, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

import { useAccountIds } from '../../accountsContext';
import { GridItem } from '../../client';
import { OwnedGridItemView } from '../../components/OwnedGridItemView';
import { useGlobals } from '../../globalsContext';
import { useSetTokenSelection } from '../../tokenSelectionContext';
import { getAccountEtherscanUrl } from '../../util/chainUtil';

interface GridItemGroup {
  groupId: string | null;
  startTokenId: number;
  gridItems: GridItem[];
}

export type OwnerPageProps = {
  ownerId: string;
}

export const OwnerPage = (props: OwnerPageProps): React.ReactElement => {
  const navigator = useNavigator();
  const { apiClient, network, web3 } = useGlobals();
  const setTokenSelection = useSetTokenSelection();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [gridItemGroups, setGridItemGroups] = React.useState<GridItemGroup[] | null | undefined>(undefined);
  const [ownerName, setOwnerName] = React.useState<string | null | undefined>(undefined);
  const accountIds = useAccountIds();

  const loadTokens = React.useCallback(async (): Promise<void> => {
    if (network === null) {
      setGridItemGroups(null);
      return;
    }
    setGridItemGroups(undefined);
    if (network === undefined) {
      return;
    }
    apiClient.listGridItems(network, true, props.ownerId).then((retrievedGridItems: GridItem[]): void => {
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
  }, [props.ownerId, network, apiClient, setTokenSelection]);

  React.useEffect((): void => {
    loadTokens();
  }, [loadTokens]);

  const loadOwnerName = React.useCallback(async (): Promise<void> => {
    setOwnerName(undefined);
    if (!web3) {
      setOwnerName(null);
      return;
    }
    const retrievedOwnerName = await web3.lookupAddress(props.ownerId);
    setOwnerName(retrievedOwnerName);
  }, [props.ownerId, web3]);

  React.useEffect((): void => {
    loadOwnerName();
  }, [loadOwnerName]);

  const isOwnerUser = Boolean(accountIds && accountIds.indexOf(props.ownerId) !== -1);
  const ownerIdString = ownerName || truncateMiddle(props.ownerId, 10);

  const onTokenIdClicked = (startTokenId: string): void => {
    navigator.navigateTo(`/tokens/${startTokenId}`);
  };

  return (
    <React.Fragment>
      <Head headId='owner'>
        <title>{`${props.ownerId}'s Tokens | Million Dollar Token Page`}</title>
      </Head>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        { network === undefined || gridItems === undefined || gridItemGroups === undefined ? (
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
                <Image source={`https://web3-images-api.kibalabs.com/v1/accounts/${props.ownerId}/image`} alternativeText='Owner Profile Picture' />
              </Box>
              <Text variant='header2' alignment={TextAlignment.Center}>{isOwnerUser ? 'Your Tokens' : `${ownerIdString}'s Tokens`}</Text>
            </Stack>
            {gridItems.length === 0 ? (
              <Text alignment={TextAlignment.Center}>{'No tokens owned'}</Text>
            ) : (
              <Text alignment={TextAlignment.Center}>{`Lord of ${gridItems.length} tokens`}</Text>
            )}
            <Button variant='invisibleNote' text={'View on etherscan'} iconRight={<KibaIcon variant='small' iconId='ion-open-outline' />} target={getAccountEtherscanUrl(network, props.ownerId) || ''} />
            <Spacing />
            <List isFullWidth={true} onItemClicked={onTokenIdClicked}>
              {gridItemGroups.map((gridItemGroup: GridItemGroup): React.ReactElement => (
                <List.Item variant='unpadded' key={gridItemGroup.startTokenId} itemKey={String(gridItemGroup.startTokenId)}>
                  <OwnedGridItemView gridItems={gridItemGroup.gridItems} startTokenId={gridItemGroup.startTokenId} isOwner={isOwnerUser} />
                </List.Item>
              ))}
            </List>
            {isOwnerUser && (
              <Button variant='primary' isFullWidth={true} text='Mint another token' />
            )}
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
