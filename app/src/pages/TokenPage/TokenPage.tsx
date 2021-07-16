import React from 'react';

import { KibaException } from '@kibalabs/core';
import { Alignment, BackgroundView, Box, Button, Direction, Form, Image, InputType, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem, PresignedUpload, TokenMetadata } from '../../client';
import { Dropzone } from '../../components/dropzone';
import { KeyValue } from '../../components/KeyValue';
import { useGlobals } from '../../globalsContext';

export type TokenPageProps = {
  tokenId: string;
}

type Result = {
  isPending: boolean;
  isSuccess: boolean;
  message: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const { contract, contractAddress, requester, apiClient, network } = useGlobals();
  const [gridItem, setGridItem] = React.useState<GridItem | null>(null);
  const [tokenMetadata, setTokenMetadata] = React.useState<TokenMetadata | null>(null);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null>(null);
  // const [newBuyResult, setNewBuyResult] = React.useState<Result | null>(null);
  const [hasStartedBuyingToken, setHasStartedBuyingToken] = React.useState<boolean>(false);
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [newTokenSettingResult, setNewTokenSettingResult] = React.useState<Result | null>(null);
  const [hasStartedUpdatingToken, setHasStartedUpdatingToken] = React.useState<boolean>(false);
  const [stakingAmount, setStakingAmount] = React.useState<string | null>(null);
  // const [newStakingResult, setNewStakingResult] = React.useState<Result | null>(null);
  const [hasStartedUpdatingStaking, setHasStartedUpdatingStaking] = React.useState<boolean>(false);
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
      const receivedTokenOwner = await contract.ownerOf(tokenId);
      setChainOwnerId(receivedTokenOwner);
      // NOTE(krishan711): is it worth pulling the metadata from the contract and showing that?
      // const tokenMetadataUrl = await contract.methods.tokenURI(tokenId).call();
      // const tokenMetadataResponse = await requester.makeRequest(RestMethod.GET, tokenMetadataUrl);
      // const tokenMetadataJson = JSON.parse(tokenMetadataResponse.content);
      // const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.image);
      // const retrievedToken = new Token(tokenId, tokenMetadataUrl, tokenMetadata);
      // setToken(retrievedToken);
    }
    setHasStartedBuyingToken(false);
    setHasStartedUpdatingToken(false);
    setHasStartedUpdatingStaking(false);
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

  const getOwnerUrl = (): string | null => {
    if (!ownerId) {
      return null;
    }
    if (network === 'rinkeby') {
      return `https://rinkeby.etherscan.io/address/${ownerId}`;
    }
    return null;
  };

  // const callContractForMinting = async (): Promise<void> => {
  //   if (!isOwnedByUser) {
  //     return;
  //   }

  //   setIsUpdating(true);

  //   if (!contract) {
  //     setNewBuyResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
  //     setIsUpdating(false);
  //     return;
  //   }

  //   setNewBuyResult(null);
  //   const tokenId = Number(props.tokenId);
  //   try {
  //     const signerIndex = accountIds.indexOf(ownerId);
  //     if (signerIndex === -1) {
  //       setNewBuyResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
  //       setIsUpdating(false);
  //     }
  //     const contractWithSigner = contract.connect(accounts[signerIndex]);

  //     // TODO(arthur-fox): Call correct function...
  //     const transaction = await contractWithSigner.setTokenURI(tokenId, '');
  //     // ...

  //     setNewBuyResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
  //     setIsUpdating(false);
  //     await transaction.wait();
  //     setNewBuyResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
  //     apiClient.updateTokenDeferred(network, Number(props.tokenId));
  //     loadToken();
  //   } catch (error) {
  //     setNewBuyResult({ isSuccess: false, isPending: false, message: error.message });
  //     setIsUpdating(false);
  //   }
  // };

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

  // const callContractForStaking = async (): Promise<void> => {
  //   if (!gridItem || !accountIds || !accounts) {
  //     return;
  //   }

  //   setIsUpdating(true);
  //   const stake = stakingAmount != null ? Number(stakingAmount) : 0;

  //   if (!contract) {
  //     setNewStakingResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
  //     setIsUpdating(false);
  //     return;
  //   }

  //   setNewStakingResult(null);
  //   const tokenId = Number(props.tokenId);
  //   try {
  //     const signerIndex = accountIds.indexOf(ownerId);
  //     if (signerIndex === -1) {
  //       setNewStakingResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
  //       setIsUpdating(false);
  //     }

  //     // TODO(arthur-fox): Call correct contract and function...
  //     const contractWithSigner = contract.connect(accounts[signerIndex]);
  //     const transaction = await contractWithSigner.setTokenURI(tokenId, stake);
  //     // ...

  //     setNewStakingResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
  //     setIsUpdating(false);
  //     await transaction.wait();
  //     setNewStakingResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
  //   } catch (error) {
  //     setNewStakingResult({ isSuccess: false, isPending: false, message: error.message });
  //     setIsUpdating(false);
  //   }
  // };

  // const onBuyTokenClicked = (): void => {
  //   setHasStartedBuyingToken(true);
  //   callContractForMinting();
  // };

  const onUpdateTokenClicked = (): void => {
    setHasStartedUpdatingToken(true);
    setHasStartedUpdatingStaking(false);
  };

  // const onUpdateStakingClicked = (): void => {
  //   setHasStartedUpdatingStaking(true);
  //   setHasStartedUpdatingToken(false);
  // };

  // const buyingInputState = (!newBuyResult || newBuyResult.isPending) ? undefined : newBuyResult?.isSuccess ? 'success' : (newBuyResult?.isSuccess === false ? 'error' : undefined);

  // const BuyTokenForm = (): React.ReactElement => (
  //   isUpdating ? (
  //     <LoadingSpinner />
  //   ) : buyingInputState ? (
  //     <Text variant='error'>{newBuyResult && newBuyResult.message}</Text>
  //   ) : (
  //     <Text variant='success'>{newBuyResult && newBuyResult.message}</Text>
  //   )
  // );

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

  // const stakingInputState = (!newStakingResult || newStakingResult.isPending) ? undefined : newStakingResult?.isSuccess ? 'success' : (newStakingResult?.isSuccess === false ? 'error' : undefined);

  // const UpdateStakingForm = (): React.ReactElement => (
  //   <Form onFormSubmitted={callContractForStaking} isLoading={isUpdating}>
  //     <Stack direction={Direction.Vertical} shouldAddGutters={true}>
  //       <Text variant='note'>{'Stake at least $100 in ETH or DAI to get your content featured. The higher the stake the more likely you are to be featured. All stake will remain yours and can be unstaked at any moment.'}</Text>
  //       <SingleLineInput
  //         inputType={InputType.Text}
  //         value={stakingAmount}
  //         onValueChanged={setStakingAmount}
  //         inputWrapperVariant={stakingInputState}
  //         messageText={newStakingResult?.message}
  //         placeholderText='Amount to stake'
  //       />
  //       <Button variant='primary' text='Stake' buttonType='submit' />
  //     </Stack>
  //   </Form>
  // );

  const ButtonsShownOnPage = (): React.ReactElement => (
    <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
      { !ownerId ? (
        <Button variant='primary' target={'https://fec48oyedt9.typeform.com/to/kzsI48jo'} text='Buy Token' />
      ) : (
        <React.Fragment>
          {/* NOTE(krishan711): these should be specific to the network */}
          <Button variant='secondary' target={`https://testnets.opensea.io/assets/${contractAddress}/${props.tokenId}`} text={isOwnedByUser ? 'View on Opensea' : 'Bid on Token'} />
          <Button variant='secondary' target={`https://rinkeby.etherscan.io/token/${contractAddress}?a=${props.tokenId}`} text='View on Etherscan' />
        </React.Fragment>
      )}
    </Stack>
  );

  const FormsShownOnPage = (): React.ReactElement | null => (
    (!accounts || !accountIds || !tokenMetadata) ? (
      <LoadingSpinner />
    ) : ((accounts && accounts.length === 0) || (accountIds && accountIds.length === 0)) ? (
      <Text variant='note'>{'Please connect your account to view more options if you are the owner.'}</Text>
    // ) : hasStartedBuyingToken ? (
    //   <BuyTokenForm />
    ) : isOwnedByUser ? (
      <React.Fragment>
        <Text>👑 This is one of your tokens 👑</Text>
        <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
          <Button variant='primary' text='Update token' onClicked={onUpdateTokenClicked} />
          {/* <Button variant='primary' text='Stake to be Featured' onClicked={onUpdateStakingClicked}/> */}
        </Stack>
        { hasStartedUpdatingToken ? (
          <UpdateTokenForm />
        // ) : hasStartedUpdatingStaking ? (
        //   <UpdateStakingForm />
        ) : null}
      </React.Fragment>
    ) : null
  );

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
                <ButtonsShownOnPage />
              </Stack.Item>
              <KeyValue name='Owned by' markdownValue={ownerId ? `[${ownerId}](${getOwnerUrl()})` : 'Nobody yet, but it could be you!'} />
              <FormsShownOnPage />
            </Stack>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
