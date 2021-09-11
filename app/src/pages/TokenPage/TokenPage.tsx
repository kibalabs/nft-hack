import React from 'react';

import { KibaException, KibaResponse, RestMethod } from '@kibalabs/core';
import { useNavigator } from '@kibalabs/core-react';
import { Alignment, BackgroundView, Box, Button, Direction, Link, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem, TokenMetadata } from '../../client';
import { ImageGrid } from '../../components/ImageGrid';
import { KeyValue } from '../../components/KeyValue';
import { MdtpImage } from '../../components/MdtpImage';
import { ShareForm } from '../../components/ShareForm';
import { useGlobals } from '../../globalsContext';
import { getAccountEtherscanUrl, getTokenEtherscanUrl, getTokenOpenseaUrl, NON_OWNER } from '../../util/chainUtil';
import { gridItemToTokenMetadata } from '../../util/gridItemUtil';
import { truncateMiddle, truncateStart } from '../../util/stringUtil';
import { getLinkableUrl, getUrlDisplayString } from '../../util/urlUtil';

export type TokenPageProps = {
  tokenId: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const navigator = useNavigator();
  const { contract, requester, apiClient, network, web3 } = useGlobals();
  const [gridItem, setGridItem] = React.useState<GridItem | null | undefined>(undefined);
  const [tokenMetadata, setTokenMetadata] = React.useState<TokenMetadata | null | undefined>(undefined);
  const [blockGridItems, setBlockGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null | undefined>(undefined);
  const [ownerName, setOwnerName] = React.useState<string | null | undefined>(undefined);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || gridItem?.ownerId || NON_OWNER;
  const isOwned = ownerId && ownerId !== NON_OWNER;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);

  const loadToken = React.useCallback(async (): Promise<void> => {
    if (network === null) {
      setGridItem(null);
      setTokenMetadata(null);
      setBlockGridItems(null);
      setChainOwnerId(null);
      return;
    }
    setGridItem(undefined);
    setTokenMetadata(undefined);
    setBlockGridItems(undefined);
    setChainOwnerId(undefined);
    if (network === undefined) {
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
        if (error.message.includes('nonexistent token')) {
          setChainOwnerId(NON_OWNER);
        } else {
          console.error(error);
        }
      });
      // NOTE(krishan711): this only works for the new contracts
      if (contract.tokenContentURI) {
        contract.tokenContentURI(tokenId).then((tokenMetadataUrl: string): void => {
          const url = tokenMetadataUrl.startsWith('ipfs://') ? tokenMetadataUrl.replace('ipfs://', 'https://ipfs.infura.io/ipfs/') : tokenMetadataUrl;
          requester.makeRequest(RestMethod.GET, url).then((response: KibaResponse): void => {
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
    if (network === null || gridItem === null) {
      setBlockGridItems(null);
      return;
    }
    setBlockGridItems(undefined);
    if (network === undefined || gridItem === undefined) {
      return;
    }
    if (gridItem.groupId) {
      apiClient.listGridItems(network, true, undefined, gridItem.groupId).then((retrievedBlockGridItems: GridItem[]): void => {
        if (retrievedBlockGridItems.length === 0 || retrievedBlockGridItems[0].groupId !== gridItem.groupId) {
          return;
        }
        setBlockGridItems(retrievedBlockGridItems);
      });
    }
  }, [gridItem, network, apiClient]);

  React.useEffect((): void => {
    loadBlockGridItems();
  }, [loadBlockGridItems]);

  const loadOwnerName = React.useCallback(async (): Promise<void> => {
    setOwnerName(undefined);
    if (ownerId && web3) {
      const retrievedOwnerName = await web3.lookupAddress(ownerId);
      setOwnerName(retrievedOwnerName);
    } else {
      setOwnerName(null);
    }
  }, [ownerId, web3]);

  React.useEffect((): void => {
    loadOwnerName();
  }, [loadOwnerName]);

  const onUpdateTokenClicked = (): void => {
    navigator.navigateTo(`/tokens/${props.tokenId}/update`);
  };

  const onMintClicked = (): void => {
    navigator.navigateTo(`/tokens/${props.tokenId}/mint`);
  };

  const OwnershipInfo = (): React.ReactElement | null => {
    if (!network || !contract) {
      return null;
    }
    const ownerIdString = ownerName || (ownerId ? truncateMiddle(ownerId, 10) : 'unknown');
    return (
      <Stack direction={Direction.Vertical} isFullWidth={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} shouldAddGutters={true}>
        { isOwned ? (
          <React.Fragment>
            <KeyValue name='Owned by' markdownValue={`[${ownerIdString}](${getAccountEtherscanUrl(network, String(ownerId))})`} />
            <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} contentAlignment={Alignment.Center} shouldAddGutters={true} shouldWrapItems={true} paddingTop={PaddingSize.Default}>
              <Button variant='secondary' target={getTokenOpenseaUrl(network, props.tokenId) || ''} text={isOwnedByUser ? 'View on Opensea' : 'Bid on Token'} />
              <Button variant='secondary' target={getTokenEtherscanUrl(network, props.tokenId) || ''} text='View on Etherscan' />
            </Stack>
          </React.Fragment>
        ) : (
          <Button variant='primary' onClicked={onMintClicked} text='Mint Token' />
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
        { tokenMetadata === undefined || gridItem === undefined ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : tokenMetadata === null || gridItem === null ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box maxHeight='400px' variant='tokenHeader'>
              { (gridItem && blockGridItems) ? (
                <ImageGrid gridItem={gridItem} blockGridItems={blockGridItems} />
              ) : (
                <BackgroundView color='#000000'>
                  <MdtpImage isCenteredHorizontally={true} variant='tokenPageHeaderGrid' fitType={'cover'} source={tokenMetadata.image} alternativeText={'token image'} />
                </BackgroundView>
              )}
            </Box>
            <Stack direction={Direction.Vertical} isFullWidth={true} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2}>
              <Text variant='header3' alignment={TextAlignment.Center}>{`TOKEN #${tokenMetadata.tokenId}`}</Text>
              <Text variant='header2' alignment={TextAlignment.Center}>{`${tokenMetadata.name}`}</Text>
              {tokenMetadata.url && (
                <Link target={getLinkableUrl(tokenMetadata.url)} text={truncateStart(getUrlDisplayString(tokenMetadata.url), 40)} />
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
              <Spacing />
              <Spacing />
              {isOwned && tokenMetadata.url ? (
                <ShareForm
                  initialShareText={`Ser, check out ${tokenMetadata.name} (${tokenMetadata.url}), just found on milliondollartokenpage.com/${tokenMetadata.tokenId} @mdtp_app, looks legit! 🚀`}
                  minRowCount={3}
                  isAllOptionsEnabled={false}
                />
              ) : isOwned && !tokenMetadata.url ? (
                <ShareForm
                  initialShareText={`Ser, check out ${tokenMetadata.name}, just found on milliondollartokenpage.com/${tokenMetadata.tokenId} @mdtp_app, looks legit! 🚀`}
                  minRowCount={3}
                  isAllOptionsEnabled={false}
                />
              ) : (
                <ShareForm
                  initialShareText={`Fren, you can mint this NFT on milliondollartokenpage.com/${tokenMetadata.tokenId} @mdtp_app and show off your JPGs. I'm gonna ape in, LFG! 🚀`}
                  minRowCount={3}
                  isAllOptionsEnabled={false}
                />
              )}
            </Stack>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
