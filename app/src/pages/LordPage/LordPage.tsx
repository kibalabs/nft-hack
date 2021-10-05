import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Direction, List, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds } from '../../accountsContext';
import { GridItem } from '../../client';
import { OwnedGridItemView } from '../../components/OwnedGridItemView';
import { useGlobals } from '../../globalsContext';
import { useSetTokenSelection } from '../../tokenSelectionContext';
import { truncateMiddle } from '../../util/stringUtil';

interface GridItemGroup {
  groupId: string | null;
  startTokenId: number;
  gridItems: GridItem[];
}

export type LordPageProps = {
  lordOwnerId: string;
}

export const LordPage = (props: LordPageProps): React.ReactElement => {
  const navigator = useNavigator();
  const { apiClient, network, web3 } = useGlobals();
  const setTokenSelection = useSetTokenSelection();
  const [gridItems, setGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [gridItemGroups, setGridItemGroups] = React.useState<GridItemGroup[] | null | undefined>(undefined);
  const [lordName, setLordName] = React.useState<string | null | undefined>(undefined);
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
    apiClient.listGridItems(network, true, props.lordOwnerId).then((retrievedGridItems: GridItem[]): void => {
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
      setGridItemGroups(groupedGridItems);
      const allTokenIds = retrievedGridItems.map((gridItem: GridItem): number => gridItem.tokenId);
      setTokenSelection(allTokenIds);
    });
  }, [props.lordOwnerId, network, apiClient, setTokenSelection]);

  React.useEffect((): void => {
    loadTokens();
  }, [loadTokens]);

  const loadLordName = React.useCallback(async (): Promise<void> => {
    setLordName(undefined);
    if (web3) {
      const retrievedOwnerName = await web3.lookupAddress(props.lordOwnerId);
      setLordName(retrievedOwnerName);
    } else {
      setLordName(null);
    }
  }, [props.lordOwnerId, web3]);

  React.useEffect((): void => {
    loadLordName();
  }, [loadLordName]);

  const isOwnerUser = Boolean(accountIds && accountIds.indexOf(props.lordOwnerId) !== -1);
  const ownerIdString = lordName || truncateMiddle(props.lordOwnerId, 10);

  const onTokenIdClicked = (startTokenId: string): void => {
    navigator.navigateTo(`/tokens/${startTokenId}`);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Lord ${props.lordOwnerId} | Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        { gridItems === undefined || gridItemGroups === undefined ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : gridItems === null || gridItemGroups === null ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Text variant='header2' alignment={TextAlignment.Center}>{isOwnerUser ? 'Your Tokens' : `${ownerIdString}'s Tokens`}</Text>
            {gridItems.length === 0 ? (
              <Text alignment={TextAlignment.Center}>{'No tokens owned'}</Text>
            ) : (
              <Text alignment={TextAlignment.Center}>{`Lord of ${gridItems.length} tokens`}</Text>
            )}
            <Spacing />
            <List isFullWidth={true} onItemClicked={onTokenIdClicked}>
              {gridItemGroups.map((gridItemGroup: GridItemGroup): React.ReactElement => (
                <List.Item variant='unpadded' key={gridItemGroup.startTokenId} itemKey={String(gridItemGroup.startTokenId)}>
                  <OwnedGridItemView gridItems={gridItemGroup.gridItems} startTokenId={gridItemGroup.startTokenId} isOwner={isOwnerUser} />
                </List.Item>
              ))}
              {/* <List.Item itemKey='add-button'>
                <Button variant='primary' isFullWidth={true} text='Mint another token' />
              </List.Item> */}
            </List>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
