import React from 'react';

import { getLinkableUrl, getUrlDisplayString, truncateMiddle, truncateStart } from '@kibalabs/core';
import { useNavigator, useNumberRouteParam } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Head, Link, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem } from '../../client';
import { Badge } from '../../components/Badge';
import { KeyValue } from '../../components/KeyValue';
import { MdtpImage } from '../../components/MdtpImage';
import { ShareForm } from '../../components/ShareForm';
import { useGlobals } from '../../globalsContext';
import { useSetTokenSelection } from '../../tokenSelectionContext';
import { getTokenEtherscanUrl, getTokenOpenseaUrl, NON_OWNER } from '../../util/chainUtil';
import { useOwnerId } from '../../util/useOwnerId';
import { useTokenData } from '../../util/useTokenMetadata';

export const TokenPage = (): React.ReactElement => {
  const tokenId = useNumberRouteParam('tokenId');

  const navigator = useNavigator();
  const setTokenSelection = useSetTokenSelection();
  const { contract, apiClient, network, web3 } = useGlobals();
  const chainOwnerId = useOwnerId(tokenId);
  const tokenData = useTokenData(tokenId);
  const tokenMetadata = tokenData.tokenMetadata;
  const gridItem = tokenData.gridItem;
  const [groupGridItems, setGroupGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [ownerName, setOwnerName] = React.useState<string | null | undefined>(undefined);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || gridItem?.ownerId || NON_OWNER;
  const isOwned = ownerId && ownerId !== NON_OWNER;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);
  const ownerIdString = ownerName || (ownerId ? truncateMiddle(ownerId, 10) : null);
  const isPartOfGroup = groupGridItems && groupGridItems.length > 1;

  const loadToken = React.useCallback(async (): Promise<void> => {
    if (network === null || gridItem === null) {
      setGroupGridItems(null);
      return;
    }
    setGroupGridItems(undefined);
    if (network === undefined || gridItem === undefined) {
      return;
    }
    if (gridItem.groupId) {
      apiClient.listGridItems(network, true, undefined, undefined, gridItem.groupId).then((retrievedBlockGridItems: GridItem[]): void => {
        if (retrievedBlockGridItems.length === 0 || retrievedBlockGridItems[0].groupId !== gridItem.groupId) {
          return;
        }
        setGroupGridItems(retrievedBlockGridItems);
      });
    } else {
      setGroupGridItems([gridItem]);
    }
  }, [network, gridItem, apiClient]);

  React.useEffect((): void => {
    loadToken();
  }, [loadToken]);

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

  React.useEffect((): void => {
    if (groupGridItems) {
      setTokenSelection(groupGridItems.map((blockGridItem: GridItem): number => blockGridItem.tokenId));
    } else {
      setTokenSelection([tokenId]);
    }
  }, [tokenId, setTokenSelection, groupGridItems]);

  const onUpdateTokenClicked = (): void => {
    navigator.navigateTo(`/tokens/${tokenId}/update`);
  };

  const onUpdateGroupClicked = (): void => {
    if (!groupGridItems) {
      onUpdateTokenClicked();
      return;
    }
    const groupTokenIds = groupGridItems.map((listGridItem: GridItem): number => listGridItem.tokenId);
    const groupTokenId = Math.min(...groupTokenIds);
    navigator.navigateTo(`/tokens/${groupTokenId}/update`);
  };

  const onMintClicked = (): void => {
    navigator.navigateTo(`/tokens/${tokenId}/mint`);
  };

  const getShareText = (): string => {
    if (!tokenMetadata) {
      return '';
    }
    if (isOwned) {
      if (tokenMetadata.url) {
        return `Frens, check out "${tokenMetadata.name}" (${tokenMetadata.url}), looks legit! I just found it on milliondollartokenpage.com/tokens/${tokenMetadata.tokenId} @mdtp_app, LFG! 🚀`;
      }
      return `Frens, check out "${tokenMetadata.name}", looks legit! I just found it on milliondollartokenpage.com/tokens/${tokenMetadata.tokenId} @mdtp_app, LFG! 🚀`;
    }
    return `Frens, you can mint this NFT on milliondollartokenpage.com/tokens/${tokenMetadata.tokenId} and show off your JPGs. @mdtp_app I'm gonna ape in, LFG! 🚀`;
  };

  const isOnChain = gridItem && gridItem.source === 'onchain';
  const isIPFS = gridItem && gridItem.contentUrl.startsWith('ipfs://');

  return (
    <React.Fragment>
      <Head headId='token'>
        <title>{`Token ${tokenId} | Million Dollar Token Page`}</title>
      </Head>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        { network === undefined || tokenMetadata === undefined || gridItem === undefined ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : network === null || tokenMetadata === null || gridItem === null ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box maxHeight='400px' isFullWidth={true} variant='tokenHeader'>
              <MdtpImage isCenteredHorizontally={true} fitType='contain' isFullWidth={true} isFullHeight={true} variant='tokenPageHeaderGrid' source={apiClient.getTokenGroupImageUrl(network, tokenId)} alternativeText={'token image'} />
            </Box>
            <Stack.Item growthFactor={1}>
              <Stack direction={Direction.Vertical} isFullWidth={true} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingTop={PaddingSize.Wide2} paddingBottom={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2}>
                <Stack direction={Direction.Horizontal} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Center}>
                  <Text variant='header6' alignment={TextAlignment.Center}>{`TOKEN #${tokenMetadata.tokenId}`}</Text>
                  {isOnChain && (
                    <Badge iconId='feather-check' hoverText='The link to this content is stored on the ethereum blockchain. It will live there forever ♾' />
                  )}
                  {isIPFS && (
                    <Badge iconId='ion-planet-outline' hoverText='This content is stored on the IPFS network. It will live there forever ♾' />
                  )}
                </Stack>
                <Text variant='header2' alignment={TextAlignment.Center}>{`${tokenMetadata.name}`}</Text>
                {tokenMetadata.url && (
                  <Link target={getLinkableUrl(tokenMetadata.url)} text={truncateStart(getUrlDisplayString(tokenMetadata.url), 40)} />
                )}
                {tokenMetadata.description && (
                  <Text>{tokenMetadata.description}</Text>
                )}
                <Stack.Item gutterBefore={PaddingSize.Default} gutterAfter={PaddingSize.Wide2}>
                  { network && isOwned ? (
                    <React.Fragment>
                      <KeyValue name='Owned by' markdownValue={`[${ownerIdString}](/owners/${String(ownerId)})`} />
                      <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} contentAlignment={Alignment.Center} shouldAddGutters={true} shouldWrapItems={true} paddingTop={PaddingSize.Default}>
                        <Button variant='secondary' target={getTokenOpenseaUrl(network, tokenId) || ''} text={isOwnedByUser ? 'View on Opensea' : 'Bid on Token'} />
                        <Button variant='secondary' target={getTokenEtherscanUrl(network, tokenId) || ''} text='View on Etherscan' />
                      </Stack>
                    </React.Fragment>
                  ) : (
                    <Button variant='primary' onClicked={onMintClicked} text='Mint Token' />
                  )}
                </Stack.Item>
                { (accounts === undefined || accountIds === undefined || tokenMetadata === undefined) ? (
                  <LoadingSpinner />
                ) : (accounts === null || accountIds === null || tokenMetadata === null) ? (
                  <React.Fragment />
                ) : (!contract || accounts?.length === 0) || (accountIds?.length === 0) ? (
                  <Text variant='note'>{'Please connect your account to view more options.'}</Text>
                ) : isOwnedByUser && (
                  <React.Fragment>
                    <Text>👑 This is one of your tokens 👑</Text>
                    <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} contentAlignment={Alignment.Center} shouldAddGutters={true} shouldWrapItems={true} paddingTop={PaddingSize.Default}>
                      <Button variant={isPartOfGroup ? 'secondary' : 'primary'} text='Update token' onClicked={onUpdateTokenClicked} />
                      {isPartOfGroup && (
                        <Button variant={'primary'} text='Update group' onClicked={onUpdateGroupClicked} />
                      )}
                    </Stack>
                  </React.Fragment>
                )}
                <Stack.Item growthFactor={1}>
                  <Spacing variant={PaddingSize.Wide} />
                </Stack.Item>
                <ShareForm
                  initialShareText={getShareText()}
                  minRowCount={3}
                  isSecondaryAction={!isOwned}
                />
              </Stack>
            </Stack.Item>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
