import React from 'react';

import { Alignment, BackgroundView, Box, Button, Direction, Form, Image, InputType, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { GridItem, PresignedUpload } from '../../client';
import { Dropzone } from '../../components/dropzone';
import { KeyValue } from '../../components/KeyValue';
import { useGlobals } from '../../globalsContext';

export type TokenPageProps = {
  tokenId: string;
  isFeatured?: boolean;
}

type Result = {
  isPending: boolean;
  isSuccess: boolean;
  message: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const { contract, contractAddress, requester, apiClient, network } = useGlobals();
  const [gridItem, setGridItem] = React.useState<GridItem | null>(null);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null>(null);
  const [newBuyResult, setNewBuyResult] = React.useState<Result | null>(null);
  const [hasStartedBuyingToken, setHasStartedBuyingToken] = React.useState<boolean>(false);
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [newTokenSettingResult, setNewTokenSettingResult] = React.useState<Result | null>(null);
  const [hasStartedUpdatingToken, setHasStartedUpdatingToken] = React.useState<boolean>(false);
  const [stakingAmount, setStakingAmount] = React.useState<string | null>(null);
  const [newStakingResult, setNewStakingResult] = React.useState<Result | null>(null);
  const [hasStartedUpdatingStaking, setHasStartedUpdatingStaking] = React.useState<boolean>(false);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const loadToken = React.useCallback(async (): Promise<void> => {
    setGridItem(null);
    setChainOwnerId(null);
    if (network === null) {
      return;
    }
    const tokenId = Number(props.tokenId);
    apiClient.retrieveGridItem(network, tokenId).then((retrievedGridItem: GridItem): void => {
      setGridItem(retrievedGridItem);
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

  const getOwnerId = (): string => {
    return chainOwnerId || gridItem?.ownerId || '';
  };

  const getOwnerUrl = (): string => {
    if (network === 'rinkeby') {
      return `https://rinkeby.etherscan.io/address/${getOwnerId()}`;
    }
    return '';
  };

  const isForSale = (): boolean => {
    const adminAddress = '0xCE11D6fb4f1e006E5a348230449Dc387fde850CC';
    const ownedByAdminAddress = getOwnerId() === adminAddress;

    const tokenId = Number(props.tokenId);
    const inMiddleBlock = (tokenId % 100 >= 38) && (tokenId % 100 <= 62) // xx38 <= w <= xx62
                          && (tokenId / 100 >= 40) && (tokenId / 100 < 60); // 40xx <= h <= 59xx

    return ownedByAdminAddress && !inMiddleBlock;
  };

  const callContractForMinting = async (): Promise<void> => {
    if (!gridItem || !accountIds || !accounts) {
      return;
    }

    setIsUpdating(true);

    if (!contract) {
      setNewBuyResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
      setIsUpdating(false);
      return;
    }

    setNewBuyResult(null);
    const tokenId = Number(props.tokenId);
    try {
      const signerIndex = accountIds.indexOf(getOwnerId());
      if (signerIndex === -1) {
        setNewBuyResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
        setIsUpdating(false);
      }
      const contractWithSigner = contract.connect(accounts[signerIndex]);

      // TODO(arthur-fox): Call correct function...
      const transaction = await contractWithSigner.setTokenURI(tokenId, '');
      // ...

      setNewBuyResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
      setIsUpdating(false);
      await transaction.wait();
      setNewBuyResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
      apiClient.updateTokenDeferred(network, Number(props.tokenId));
      loadToken();
    } catch (error) {
      setNewBuyResult({ isSuccess: false, isPending: false, message: error.message });
      setIsUpdating(false);
    }
  };

  const callContractForUpdating = async (): Promise<void> => {
    if (!gridItem || !accountIds || !accounts) {
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
      const signerIndex = accountIds.indexOf(getOwnerId());
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

  const callContractForStaking = async (): Promise<void> => {
    if (!gridItem || !accountIds || !accounts) {
      return;
    }

    setIsUpdating(true);
    const stake = stakingAmount != null ? Number(stakingAmount) : 0;

    if (!contract) {
      setNewStakingResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
      setIsUpdating(false);
      return;
    }

    setNewStakingResult(null);
    const tokenId = Number(props.tokenId);
    try {
      const signerIndex = accountIds.indexOf(getOwnerId());
      if (signerIndex === -1) {
        setNewStakingResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
        setIsUpdating(false);
      }

      // TODO(arthur-fox): Call correct contract and function...
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      const transaction = await contractWithSigner.setTokenURI(tokenId, stake);
      // ...

      setNewStakingResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
      setIsUpdating(false);
      await transaction.wait();
      setNewStakingResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
    } catch (error) {
      setNewStakingResult({ isSuccess: false, isPending: false, message: error.message });
      setIsUpdating(false);
    }
  };

  // eslint-disable-next-line unused-imports/no-unused-vars
  const onBuyTokenClicked = (): void => {
    setHasStartedBuyingToken(true);
    callContractForMinting();
  };

  const onUpdateTokenClicked = (): void => {
    setHasStartedUpdatingToken(true);
    setHasStartedUpdatingStaking(false);
  };
  
  const onUpdateStakingClicked = (): void => {
    setHasStartedUpdatingStaking(true);
    setHasStartedUpdatingToken(false);
  };

  const buyingInputState = (!newBuyResult || newBuyResult.isPending) ? undefined : newBuyResult?.isSuccess ? 'success' : (newBuyResult?.isSuccess === false ? 'error' : undefined);

  const BuyTokenForm = (): React.ReactElement => (
    <React.Fragment>
      {isUpdating ? (
        <React.Fragment>
          <LoadingSpinner />
        </React.Fragment>
      ) : buyingInputState ? (
        <Text variant='error'>{newBuyResult && newBuyResult.message}</Text>
      ) : (
        <Text variant='success'>{newBuyResult && newBuyResult.message}</Text>
      )}
    </React.Fragment>
  );

  const updateInputState = (!newTokenSettingResult || newTokenSettingResult.isPending) ? undefined : newTokenSettingResult?.isSuccess ? 'success' : (newTokenSettingResult?.isSuccess === false ? 'error' : undefined);

  const UpdateTokenForm = (): React.ReactElement => (
    <React.Fragment>
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
    </React.Fragment>
  );

  const stakingInputState = (!newStakingResult || newStakingResult.isPending) ? undefined : newStakingResult?.isSuccess ? 'success' : (newStakingResult?.isSuccess === false ? 'error' : undefined);

  const UpdateStakingForm = (): React.ReactElement => (
    <React.Fragment>
      <Form onFormSubmitted={callContractForStaking} isLoading={isUpdating}>
        <Stack direction={Direction.Vertical} shouldAddGutters={true}>
          <Text variant='note'>{'Stake at least $100 in ETH or DAI to get your content featured. The higher the stake the more likely you are to be featured. All stake will remain yours and can be unstaked at any moment.'}</Text>
          <SingleLineInput
            inputType={InputType.Text}
            value={stakingAmount}
            onValueChanged={setStakingAmount}
            inputWrapperVariant={stakingInputState}
            messageText={newStakingResult?.message}
            placeholderText='Amount to stake'
          />
          <Button variant='primary' text='Stake' buttonType='submit' />
        </Stack>
      </Form>
    </React.Fragment>
  );

  const ButtonsShownOnPage = (): React.ReactElement => (
    <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
      { isForSale() ? (
        <Button variant='primary' target={'https://fec48oyedt9.typeform.com/to/kzsI48jo'} text='Buy Token' />
      ) : gridItem && accountIds && accountIds.includes(getOwnerId()) ? (
        <React.Fragment>
          <Button variant='secondary' target={`https://testnets.opensea.io/assets/${contractAddress}/${gridItem.tokenId}`} text='View on Opensea' />
          <Button variant='secondary' target={`https://rinkeby.etherscan.io/token/${contractAddress}?a=${gridItem.tokenId}`} text='View on Etherscan' />
        </React.Fragment>
      ) : gridItem ? (
        <React.Fragment>
          <Button variant='secondary' target={`https://testnets.opensea.io/assets/${contractAddress}/${gridItem.tokenId}`} text='Bid on Token' />
          <Button variant='secondary' target={`https://rinkeby.etherscan.io/token/${contractAddress}?a=${gridItem.tokenId}`} text='View on Etherscan' />
        </React.Fragment>
      ) : null }
    </Stack>
  );

  const OwnershipShownOnPage = (): React.ReactElement => (
    <React.Fragment>
      { isForSale() ? (
        <KeyValue name='Owned by' markdownValue={'Nobody yet, but it could be you!'} />
      ) : (
        <KeyValue name='Owned by' markdownValue={`[${getOwnerId()}](${getOwnerUrl()})`} />
      )}
    </React.Fragment>
  );

  const FormsShownOnPage = (): React.ReactElement => (
    <React.Fragment>
      { (!accounts || !accountIds || !gridItem || !gridItem.tokenId) ? (
        <LoadingSpinner />
      ) : ((accounts && accounts.length === 0) || (accountIds && accountIds.length === 0)) ? (
        <Text variant='note'>{'Please connect your account to view more options if you are the owner.'}</Text>
      ) : hasStartedBuyingToken ? (
        <BuyTokenForm />
      ) : !isForSale() && (accountIds && accountIds.includes(getOwnerId())) ? (
        <React.Fragment>
          <Text>👑 This is one of your tokens 👑</Text>
          <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
            <Button variant='primary' text='Update token' onClicked={onUpdateTokenClicked} />
            <Button variant='primary' text='Stake to be Featured' onClicked={onUpdateStakingClicked}/>
          </Stack>
          { hasStartedUpdatingToken ? (
            <UpdateTokenForm />
          ) : hasStartedUpdatingStaking ? (
            <UpdateStakingForm />
          ) : null}
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Token ${props.tokenId} | The Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        { !gridItem ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box maxHeight='250px' variant='tokenHeader'>
              <BackgroundView color='#000000'>
                <Image isCenteredHorizontally={true} fitType={'cover'} source={gridItem.imageUrl} alternativeText={`${gridItem.title} image`} />
              </BackgroundView>
            </Box>
            <Stack direction={Direction.Vertical} shouldAddGutters={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2}>
              {props.isFeatured && (
                <React.Fragment>
                  <Text variant='header1'>{'Featured Token!'}</Text>
                  <Text variant='note'>{'Set a stake in your token for a chance to be featured'}</Text>
                  <Spacing direction={Direction.Vertical} />
                  <Spacing direction={Direction.Vertical} />
                </React.Fragment>
              )}
              <Text variant='header3'>{`TOKEN #${gridItem.tokenId}`}</Text>
              <Text variant='header2'>{`${gridItem.title}`}</Text>
              <Text>{`DESCRIPTION: ${gridItem.description}`}</Text>
              <Stack.Item gutterBefore={PaddingSize.Wide1} gutterAfter={PaddingSize.Wide2}>
                <ButtonsShownOnPage />
              </Stack.Item>
              <OwnershipShownOnPage />
              <FormsShownOnPage />
            </Stack>
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
