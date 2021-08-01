import React from 'react';

import { KibaException, KibaResponse, RestMethod } from '@kibalabs/core';
import { useNavigator } from '@kibalabs/core-react';
import { Alignment, BackgroundView, Box, Button, Direction, Image, Link, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem, TokenMetadata } from '../../client';
import { ImageGrid } from '../../components/ImageGrid';
import { KeyValue } from '../../components/KeyValue';
import { useGlobals } from '../../globalsContext';
import { getAccountEtherscanUrl, getTokenEtherscanUrl, getTokenOpenseaUrl } from '../../util/chainUtil';
import { gridItemToTokenMetadata } from '../../util/gridItemUtil';
import { truncate } from '../../util/stringUtil';
import { getLinkableUrl, getUrlDisplayString } from '../../util/urlUtil';

export type TokenPageProps = {
  tokenId: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const navigator = useNavigator();
  const { contract, requester, apiClient, network } = useGlobals();
  const [gridItem, setGridItem] = React.useState<GridItem | null>(null);
  const [tokenMetadata, setTokenMetadata] = React.useState<TokenMetadata | null>(null);
  const [blockGridItems, setBlockGridItems] = React.useState<GridItem[] | null>(null);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null>(null);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || gridItem?.ownerId || null;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);

  const loadToken = React.useCallback(async (): Promise<void> => {
    setGridItem(null);
    setTokenMetadata(null);
    setBlockGridItems(null);
    setChainOwnerId(null);
    if (network === null) {
      return;
    }
    const tokenId = Number(props.tokenId);
    apiClient.retrieveGridItem(network, tokenId).then((retrievedGridItem: GridItem): void => {
      setGridItem(retrievedGridItem);
      setTokenMetadata(gridItemToTokenMetadata(retrievedGridItem));
    }).catch((error: KibaException): void => {
      if (error.statusCode === 404) {
        // TODO(krishan711): Get the token metadata from the contract
        apiClient.getTokenDefaultContent(tokenId).then((retrievedTokenMetadata: TokenMetadata): void => {
          setTokenMetadata(retrievedTokenMetadata);
        });
      }
    });
    if (contract) {
      contract.ownerOf(tokenId).then((retrievedTokenOwner: string): void => {
        setChainOwnerId(retrievedTokenOwner);
      }).catch((error: Error): void => {
        if (!error.message.includes('nonexistent token')) {
          console.error(error);
        }
      });
      // NOTE(krishan711): this only works for the new contracts
      if (contract.tokenContentURI) {
        contract.tokenContentURI(tokenId).then((tokenMetadataUrl: string): void => {
          requester.makeRequest(RestMethod.GET, tokenMetadataUrl).then((response: KibaResponse): void => {
            const tokenMetadataJson = JSON.parse(response.content);
            // NOTE(krishan711): this should validate the content cos if someone hasn't filled it correctly it could cause something bad
            setTokenMetadata(TokenMetadata.fromObject({ ...tokenMetadataJson, tokenId }));
          });
        });
      }
    }
  }, [props.tokenId, network, contract, apiClient, requester]);

  React.useEffect((): void => {
    loadToken();
  }, [loadToken]);

  const loadBlockGridItems = React.useCallback(async (): Promise<void> => {
    setBlockGridItems(null);
    if (gridItem && gridItem.blockId) {
      apiClient.listGridItems(network, true, undefined, gridItem.blockId).then((retrievedBlockGridItems: GridItem[]): void => {
        if (retrievedBlockGridItems.length === 0 || retrievedBlockGridItems[0].blockId !== gridItem.blockId) {
          return;
        }
        setBlockGridItems(retrievedBlockGridItems);
      });
    }
  }, [gridItem, network, apiClient]);

  React.useEffect((): void => {
    loadBlockGridItems();
  }, [loadBlockGridItems]);

  const onUpdateTokenClicked = (): void => {
    navigator.navigateTo(`/tokens/${props.tokenId}/update`);
  };

  const OwnershipInfo = (): React.ReactElement => {
    const isBuyable = !ownerId || (network === 'rinkeby' && ownerId === '0xCE11D6fb4f1e006E5a348230449Dc387fde850CC');
    const ownerIdString = ownerId ? truncate(ownerId, 20) : 'unknown';
    return (
      <Stack direction={Direction.Vertical} isFullWidth={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} shouldAddGutters={true}>
        { isBuyable ? (
          <Button variant='primary' target={'https://fec48oyedt9.typeform.com/to/kzsI48jo'} text='Buy Token' />
        ) : (
          <KeyValue name='Owned by' markdownValue={`[${ownerIdString}](${getAccountEtherscanUrl(network, String(ownerId))})`} />
        )}
        { gridItem && (
          <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} contentAlignment={Alignment.Center} shouldAddGutters={true} shouldWrapItems={true} paddingTop={PaddingSize.Default}>
            <Button variant='secondary' target={getTokenOpenseaUrl(network, props.tokenId) || ''} text={isBuyable || isOwnedByUser ? 'View on Opensea' : 'Bid on Token'} />
            <Button variant='secondary' target={getTokenEtherscanUrl(network, props.tokenId) || ''} text='View on Etherscan' />
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Token ${props.tokenId} | Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        { !tokenMetadata ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box maxHeight='400px' variant='tokenHeader'>
              { (gridItem && blockGridItems) ? (
                <ImageGrid gridItem={gridItem} blockGridItems={blockGridItems} />
              ) : (
                <BackgroundView color='#000000'>
                  <Image isCenteredHorizontally={true} variant='tokenPageHeaderGrid' fitType={'cover'} source={tokenMetadata.image} alternativeText={'token image'} />
                </BackgroundView>
              )}
            </Box>
            <Stack direction={Direction.Vertical} isFullWidth={true} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2}>
              <Text variant='header3' alignment={TextAlignment.Center}>{`TOKEN #${tokenMetadata.tokenId}`}</Text>
              <Text variant='header2' alignment={TextAlignment.Center}>{`${tokenMetadata.name}`}</Text>
              {tokenMetadata.url && (
                <Link target={getLinkableUrl(tokenMetadata.url)} text={getUrlDisplayString(tokenMetadata.url)} />
              )}
              {tokenMetadata.description && (
                <Text>{tokenMetadata.description}</Text>
              )}
              <Stack.Item gutterBefore={PaddingSize.Default} gutterAfter={PaddingSize.Wide2}>
                <OwnershipInfo />
              </Stack.Item>
              { !contract ? (
                <Text variant='note'>{'Please connect your wallet to view more options.'}</Text>
              ) : !accounts || !accountIds || !tokenMetadata ? (
                <LoadingSpinner />
              ) : (accounts?.length === 0) || (accountIds?.length === 0) ? (
                <Text variant='note'>{'Please connect your account to view more options.'}</Text>
              ) : isOwnedByUser && (
                <React.Fragment>
                  <Text>👑 This is one of your tokens 👑</Text>
                  <Button variant='primary' text='Update token' onClicked={onUpdateTokenClicked} />
                </React.Fragment>
              )}
            </Stack>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
