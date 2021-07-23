import React from 'react';

import { KibaException, KibaResponse, RestMethod } from '@kibalabs/core';
import { Alignment, BackgroundView, Box, Button, Direction, Form, Image, InputType, Link, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem, TokenMetadata } from '../../client';
import { Dropzone } from '../../components/dropzone';
import { ImageGrid } from '../../components/ImageGrid';
import { KeyValue } from '../../components/KeyValue';
import { useGlobals } from '../../globalsContext';
import { getAccountEtherscanUrl, getTokenEtherscanUrl, getTokenOpenseaUrl } from '../../util/chainUtil';
import { gridItemToTokenMetadata } from '../../util/gridItemUtil';
import { getLinkableUrl, getUrlDisplayString } from '../../util/urlUtil';

export type TokenPageProps = {
  tokenId: string;
}

type Result = {
  isPending: boolean;
  isSuccess: boolean;
  message: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const { contract, requester, apiClient, network } = useGlobals();
  const [gridItem, setGridItem] = React.useState<GridItem | null>(null);
  const [tokenMetadata, setTokenMetadata] = React.useState<TokenMetadata | null>(null);
  const [blockGridItems, setBlockGridItems] = React.useState<GridItem[] | null>(null);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newUrl, setNewUrl] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [updatingTokenResult, setUpdatingTokenResult] = React.useState<Result | null>(null);
  const [hasStartedUpdatingToken, setHasStartedUpdatingToken] = React.useState<boolean>(false);
  const [isUpdatingToken, setIsUpdatingToken] = React.useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || gridItem?.ownerId || null;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);

  const loadToken = React.useCallback(async (): Promise<void> => {
    setGridItem(null);
    setTokenMetadata(null);
    setBlockGridItems(null);
    setChainOwnerId(null);
    setHasStartedUpdatingToken(false);
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

  const onImageFilesChosen = async (files: File[]): Promise<void> => {
    // TODO(krishan711): ensure there is only one file
    setIsUploadingImage(true);
    try {
      const presignedUpload = await apiClient.generateImageUploadForToken(network, Number(props.tokenId));
      const file = files[0];
      // @ts-ignore
      const fileName = file.path.replace(/^\//g, '');
      const formData = new FormData();
      Object.keys(presignedUpload.params).forEach((key: string): void => {
        formData.set(key, presignedUpload.params[key]);
      });
      // eslint-disable-next-line no-template-curly-in-string
      formData.set('key', presignedUpload.params.key.replace('${filename}', fileName));
      formData.set('Content-Type', file.type);
      formData.append('file', file, file.name);
      await requester.makeFormRequest(presignedUpload.url, formData);
      // eslint-disable-next-line no-template-curly-in-string
      setNewImageUrl(`${presignedUpload.url}${presignedUpload.params.key.replace('${filename}', fileName)}`);
      setIsUploadingImage(false);
    } catch (error: unknown) {
      console.error(error);
      setNewImageUrl('');
      setIsUploadingImage(false);
    }
  };

  const onUpdateTokenFormSubmitted = async (): Promise<void> => {
    if (!gridItem || !accountIds || !accounts || !ownerId) {
      return;
    }

    setIsUpdatingToken(true);
    const title = newTitle != null ? newTitle : gridItem.title;
    const description = newDescription != null ? newDescription : gridItem.description;
    const image = newImageUrl != null ? newImageUrl : gridItem.imageUrl;
    const url = newUrl != null ? newUrl : gridItem.url;
    const blockId = gridItem.blockId;
    const tokenMetadataUrl = await apiClient.uploadMetadataForToken(gridItem.network, gridItem.tokenId, title, description || null, image, url, blockId);

    if (!contract) {
      setUpdatingTokenResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
      setIsUpdatingToken(false);
      return;
    }

    setUpdatingTokenResult(null);
    const tokenId = Number(props.tokenId);
    try {
      const signerIndex = accountIds.indexOf(ownerId);
      if (signerIndex === -1) {
        setUpdatingTokenResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
        setIsUpdatingToken(false);
      }
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      let transaction = null;
      if (contractWithSigner.setTokenURI) {
        transaction = await contractWithSigner.setTokenURI(tokenId, tokenMetadataUrl);
      } else if (contractWithSigner.setTokenContentURI) {
        transaction = await contractWithSigner.setTokenContentURI(tokenId, tokenMetadataUrl);
      } else {
        setUpdatingTokenResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
        return;
      }
      setUpdatingTokenResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
      setIsUpdatingToken(false);
      await transaction.wait();
      setUpdatingTokenResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
      apiClient.updateTokenDeferred(network, Number(props.tokenId));
      loadToken();
    } catch (error) {
      setUpdatingTokenResult({ isSuccess: false, isPending: false, message: error.message });
      setIsUpdatingToken(false);
    }
  };

  const onUpdateTokenClicked = (): void => {
    setHasStartedUpdatingToken(true);
  };

  const updateInputState = (!updatingTokenResult || updatingTokenResult.isPending) ? undefined : updatingTokenResult?.isSuccess ? 'success' : (updatingTokenResult?.isSuccess === false ? 'error' : undefined);

  const OwnershipInfo = (): React.ReactElement => {
    const isBuyable = !ownerId || (network === 'rinkeby' && ownerId === '0xCE11D6fb4f1e006E5a348230449Dc387fde850CC');
    return (
      <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} shouldAddGutters={true}>
        { isBuyable ? (
          <Button variant='primary' target={'https://fec48oyedt9.typeform.com/to/kzsI48jo'} text='Buy Token' />
        ) : (
          <KeyValue name='Owned by' markdownValue={`[${ownerId}](${getAccountEtherscanUrl(network, String(ownerId))})`} />
        )}
        { gridItem && (
          <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
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
        <title>{`Token ${props.tokenId} | The Million Dollar Token Page`}</title>
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
            <Stack direction={Direction.Vertical} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2}>
              <Text variant='header3'>{`TOKEN #${tokenMetadata.tokenId}`}</Text>
              <Text variant='header2'>{`${tokenMetadata.name}`}</Text>
              {tokenMetadata.url && (
                <Link target={getLinkableUrl(tokenMetadata.url)} text={getUrlDisplayString(tokenMetadata.url)} />
              )}
              {tokenMetadata.description && (
                <Text>{tokenMetadata.description}</Text>
              )}
              <Stack.Item gutterBefore={PaddingSize.Wide1} gutterAfter={PaddingSize.Wide2}>
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
                  <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
                    <Button variant='primary' text='Update token' onClicked={onUpdateTokenClicked} />
                  </Stack>
                  { hasStartedUpdatingToken && (
                    <Form onFormSubmitted={onUpdateTokenFormSubmitted} isLoading={isUpdatingToken}>
                      <Stack direction={Direction.Vertical} shouldAddGutters={true}>
                        <SingleLineInput
                          inputType={InputType.Text}
                          value={newTitle}
                          onValueChanged={setNewTitle}
                          inputWrapperVariant={updateInputState}
                          placeholderText='Name'
                        />
                        <SingleLineInput
                          inputType={InputType.Text}
                          value={newDescription}
                          onValueChanged={setNewDescription}
                          inputWrapperVariant={updateInputState}
                          placeholderText='Description'
                        />
                        <SingleLineInput
                          inputType={InputType.Url}
                          value={newUrl}
                          onValueChanged={setNewUrl}
                          inputWrapperVariant={updateInputState}
                          placeholderText='URL'
                        />
                        {isUploadingImage ? (
                          <Text>Uploading image...</Text>
                        ) : (
                          <React.Fragment>
                            <SingleLineInput
                              inputType={InputType.Url}
                              value={newImageUrl}
                              onValueChanged={setNewImageUrl}
                              inputWrapperVariant={updateInputState}
                              messageText={updatingTokenResult?.message}
                              placeholderText='Image URL'
                            />
                            <Text variant='note'>OR</Text>
                            <Dropzone onFilesChosen={onImageFilesChosen} />
                          </React.Fragment>
                        )}
                        <Button variant='primary' text='Update' buttonType='submit' />
                      </Stack>
                    </Form>
                  )}
                </React.Fragment>
              )}
            </Stack>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
