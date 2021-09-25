import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, BackgroundView, Box, Button, Direction, Link, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem } from '../../client';
import { Badge } from '../../components/Badge';
import { ImageGrid } from '../../components/ImageGrid';
import { KeyValue } from '../../components/KeyValue';
import { MdtpImage } from '../../components/MdtpImage';
import { ShareForm } from '../../components/ShareForm';
import { useGlobals } from '../../globalsContext';
import { useSetTokenSelection } from '../../tokenSelectionContext';
import { getAccountEtherscanUrl, getTokenEtherscanUrl, getTokenOpenseaUrl, NON_OWNER } from '../../util/chainUtil';
import { truncateMiddle, truncateStart } from '../../util/stringUtil';
import { getLinkableUrl, getUrlDisplayString } from '../../util/urlUtil';
import { useOwnerId } from '../../util/useOwnerId';
import { useTokenData } from '../../util/useTokenMetadata';


export type TokenPageProps = {
  tokenId: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const navigator = useNavigator();
  const setTokenSelection = useSetTokenSelection();
  const { contract, apiClient, network, web3 } = useGlobals();
  const chainOwnerId = useOwnerId(Number(props.tokenId));
  const tokenData = useTokenData(Number(props.tokenId));
  const tokenMetadata = tokenData.tokenMetadata;
  const gridItem = tokenData.gridItem;
  const [blockGridItems, setBlockGridItems] = React.useState<GridItem[] | null | undefined>(undefined);
  const [ownerName, setOwnerName] = React.useState<string | null | undefined>(undefined);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || gridItem?.ownerId || NON_OWNER;
  const isOwned = ownerId && ownerId !== NON_OWNER;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);

  const loadToken = React.useCallback(async (): Promise<void> => {
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
    } else {
      setBlockGridItems([]);
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
    if (blockGridItems) {
      setTokenSelection(blockGridItems.map((blockGridItem: GridItem): number => blockGridItem.tokenId));
    } else {
      setTokenSelection([Number(props.tokenId)]);
    }
  }, [props.tokenId, setTokenSelection, blockGridItems]);

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

  const getShareText = (): string => {
    if (!tokenMetadata) {
      return '';
    }
    if (isOwned) {
      if (tokenMetadata.url) {
        return `Ser, check out "${tokenMetadata.name}" (${tokenMetadata.url}). I just found it on milliondollartokenpage.com/tokens/${tokenMetadata.tokenId}, @mdtp_app looks legit! 🚀`;
      }
      return `Ser, check out "${tokenMetadata.name}". I just found it on milliondollartokenpage.com/tokens/${tokenMetadata.tokenId}, @mdtp_app looks legit! 🚀`;
    }
    return `Frens, you can mint this NFT on milliondollartokenpage.com/tokens/${tokenMetadata.tokenId} and show off your JPGs. @mdtp_app I'm gonna ape in, LFG! 🚀`;
  };

  const isOnChain = gridItem && gridItem.source === 'onchain';
  const isIPFS = gridItem && gridItem.contentUrl.startsWith('ipfs://');

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
            <Stack.Item growthFactor={1}>
              <Stack direction={Direction.Vertical} isFullWidth={true} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2}>
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
                <Stack.Item growthFactor={1}>
                  <Spacing variant={PaddingSize.Wide} />
                </Stack.Item>
                <ShareForm
                  initialShareText={getShareText()}
                  minRowCount={3}
                  shouldShowAllOptions={false}
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
