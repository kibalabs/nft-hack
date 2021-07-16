import React from 'react';

import { KibaException } from '@kibalabs/core';
import { Alignment, BackgroundView, Box, Button, Direction, Form, Image, InputType, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem, PresignedUpload, TokenMetadata } from '../../client';
import { Dropzone } from '../../components/dropzone';
import { KeyValue } from '../../components/KeyValue';
import { useGlobals } from '../../globalsContext';
import { getAccountEtherscanUrl, getTokenEtherscanUrl, getTokenOpenseaUrl } from '../../util/chainUtil';

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
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [newTokenSettingResult, setNewTokenSettingResult] = React.useState<Result | null>(null);
  const [hasStartedUpdatingToken, setHasStartedUpdatingToken] = React.useState<boolean>(false);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || gridItem?.ownerId || null;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);

  const loadToken = React.useCallback(async (): Promise<void> => {
    setGridItem(null);
    setChainOwnerId(null);
    setTokenMetadata(null);
    setHasStartedUpdatingToken(false);
    if (network === null) {
      return;
    }
    const tokenId = Number(props.tokenId);
    apiClient.retrieveGridItem(network, tokenId).then((retrievedGridItem: GridItem): void => {
      setGridItem(retrievedGridItem);
      setTokenMetadata(new TokenMetadata(String(tokenId), tokenId - 1, retrievedGridItem.title, retrievedGridItem.description || '', retrievedGridItem.resizableImageUrl || retrievedGridItem.imageUrl));
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
      // NOTE(krishan711): is it worth pulling the metadata from the contract and showing that?
      // const tokenMetadataUrl = await contract.methods.tokenURI(tokenId).call();
      // const tokenMetadataResponse = await requester.makeRequest(RestMethod.GET, tokenMetadataUrl);
      // const tokenMetadataJson = JSON.parse(tokenMetadataResponse.content);
      // const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.image);
      // const retrievedToken = new Token(tokenId, tokenMetadataUrl, tokenMetadata);
      // setToken(retrievedToken);
    }
  }, [props.tokenId, network, contract, apiClient]);

  React.useEffect((): void => {
    loadToken();
  }, [loadToken]);

  const onImageFilesChosen = async (files: File[]): Promise<void> => {
    // TODO(krishan711): ensure there is only one file
    setIsUploadingImage(true);
    apiClient.generateImageUploadForToken(network, Number(props.tokenId)).then((presignedUpload: PresignedUpload): void => {
      const file = files[0];
      // @ts-ignore
      const fileName = file.path.replace(/^\//g, '');
      const formData = new FormData();
      Object.keys(presignedUpload.params).forEach((key: string): void => {
        formData.set(key, presignedUpload.params[key]);
      });
      // eslint-disable-next-line no-template-curly-in-string
      formData.set('key', presignedUpload.params.key.replace('${filename}', fileName));
      formData.set('content-type', file.type);
      formData.append('file', file, file.name);
      requester.makeFormRequest(presignedUpload.url, formData).then((): void => {
        // eslint-disable-next-line no-template-curly-in-string
        setNewImageUrl(`${presignedUpload.url}${presignedUpload.params.key.replace('${filename}', fileName)}`);
        setIsUploadingImage(false);
      });
    }).catch((): void => {
      setNewImageUrl('');
      setIsUploadingImage(false);
    });
  };

  const callContractForUpdating = async (): Promise<void> => {
    if (!gridItem || !accountIds || !accounts || !ownerId) {
      return;
    }

    setIsUpdating(true);
    const title = newTitle != null ? newTitle : gridItem.title;
    const description = newDescription != null ? newDescription : gridItem.description;
    const image = newImageUrl != null ? newImageUrl : gridItem.imageUrl;
    const tokenMetadataUrl = await apiClient.uploadMetadataForToken(gridItem.network, gridItem.tokenId, title || '', description || '', image || '');

    if (!contract) {
      setNewTokenSettingResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
      setIsUpdating(false);
      return;
    }

    setNewTokenSettingResult(null);
    const tokenId = Number(props.tokenId);
    try {
      const signerIndex = accountIds.indexOf(ownerId);
      if (signerIndex === -1) {
        setNewTokenSettingResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
        setIsUpdating(false);
      }
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      const transaction = await contractWithSigner.setTokenURI(tokenId, tokenMetadataUrl);
      setNewTokenSettingResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
      setIsUpdating(false);
      await transaction.wait();
      setNewTokenSettingResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
      apiClient.updateTokenDeferred(network, Number(props.tokenId));
      loadToken();
    } catch (error) {
      setNewTokenSettingResult({ isSuccess: false, isPending: false, message: error.message });
      setIsUpdating(false);
    }
  };

  const onUpdateTokenClicked = (): void => {
    setHasStartedUpdatingToken(true);
  };

  const updateInputState = (!newTokenSettingResult || newTokenSettingResult.isPending) ? undefined : newTokenSettingResult?.isSuccess ? 'success' : (newTokenSettingResult?.isSuccess === false ? 'error' : undefined);

  const UpdateTokenForm = (): React.ReactElement => (
    <Form onFormSubmitted={callContractForUpdating} isLoading={isUpdating}>
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
        {isUploadingImage ? (
          <Text>Uploading image...</Text>
        ) : (
          <React.Fragment>
            <SingleLineInput
              inputType={InputType.Url}
              value={newImageUrl}
              onValueChanged={setNewImageUrl}
              inputWrapperVariant={updateInputState}
              messageText={newTokenSettingResult?.message}
              placeholderText='Image URL'
            />
            <Text variant='note'>OR</Text>
            <Dropzone onFilesChosen={onImageFilesChosen} />
          </React.Fragment>
        )}
        <Button variant='primary' text='Update' buttonType='submit' />
      </Stack>
    </Form>
  );

  const OwnershipInfo = (): React.ReactElement => {
    const isBuyable = !ownerId || ownerId === '0xCE11D6fb4f1e006E5a348230449Dc387fde850CC';
    return (
      <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} shouldAddGutters={true}>
        { isBuyable ? (
          <Button variant='primary' target={'https://fec48oyedt9.typeform.com/to/kzsI48jo'} text='Buy Token' />
        ) : (
          <KeyValue name='Owned by' markdownValue={`[${ownerId}](${getAccountEtherscanUrl(network, ownerId)})`} />
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

  const FormsShownOnPage = (): React.ReactElement | null => {
    if (!contract) {
      return null;
    }
    if (!accounts || !accountIds || !tokenMetadata) {
      return (
        <LoadingSpinner />
      );
    }
    if ((accounts?.length === 0) || (accountIds?.length === 0)) {
      return (
        <Text variant='note'>{'Please connect your account to view more options.'}</Text>
      );
    }
    if (isOwnedByUser) {
      return (
        <React.Fragment>
          <Text>👑 This is one of your tokens 👑</Text>
          <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
            <Button variant='primary' text='Update token' onClicked={onUpdateTokenClicked} />
          </Stack>
          { hasStartedUpdatingToken && (
            <UpdateTokenForm />
          )}
        </React.Fragment>
      );
    }
    return null;
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
            <Box maxHeight='250px' variant='tokenHeader'>
              <BackgroundView color='#000000'>
                <Image isCenteredHorizontally={true} fitType={'cover'} source={tokenMetadata.image} alternativeText={`${tokenMetadata.name} image`} />
              </BackgroundView>
            </Box>
            <Stack direction={Direction.Vertical} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2}>
              <Text variant='header3'>{`TOKEN #${tokenMetadata.tokenId}`}</Text>
              <Text variant='header2'>{`${tokenMetadata.name}`}</Text>
              <Text>{`DESCRIPTION: ${tokenMetadata.description}`}</Text>
              <Stack.Item gutterBefore={PaddingSize.Wide1} gutterAfter={PaddingSize.Wide2}>
                <OwnershipInfo />
              </Stack.Item>
              <FormsShownOnPage />
            </Stack>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
