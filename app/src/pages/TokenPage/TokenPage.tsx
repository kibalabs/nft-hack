import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useInitialization, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Form, Image, InputType, KibaIcon, LoadingSpinner, PaddingSize, ResponsiveContainingView, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccounts } from '../../accountsContext';
import { useGlobals } from '../../globalsContext';
import { Token, TokenMetadata } from '../../model';

export type TokenPageProps = {
  tokenId: string;
}

type Result = {
  isPending: boolean;
  isSuccess: boolean;
  message: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const { contract, requester } = useGlobals();
  const navigator = useNavigator();
  const [token, setToken] = React.useState<Token | null>(null);
  const [tokenOwner, setTokenOwner] = React.useState<string | null>(null);
  const [newTokenUrl, setNewTokenUrl] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [newTokenSettingResult, setNewTokenSettingResult] = React.useState<Result | null>(null);
  const accounts = useAccounts();

  useInitialization((): void => {
    loadToken();
  });

  const loadToken = async (): Promise<void> => {
    const tokenId = Number(props.tokenId);
    const receivedTokenOwner = await contract.methods.ownerOf(tokenId).call();
    setTokenOwner(receivedTokenOwner);
    const tokenMetadataUrl = await contract.methods.tokenURI(tokenId).call();
    const tokenMetadataResponse = await requester.makeRequest(RestMethod.GET, tokenMetadataUrl);
    const tokenMetadataJson = JSON.parse(tokenMetadataResponse.content);
    const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.image);
    const retrievedToken = new Token(tokenId, tokenMetadataUrl, tokenMetadata);
    setToken(retrievedToken);
  };

  const onUpdateMetadataClicked = async (): Promise<void> => {
    if (!token) {
      return;
    }

    const tokenId = Number(props.tokenId);
    const name = newName != null ? newName : token.metadata.name;
    const description = newDescription != null ? newDescription : token.metadata.description;
    const image = newImageUrl != null ? newImageUrl : token.metadata.imageUrl;
    const tokenMetadata = new TokenMetadata(name, description, image);
    const updatedToken = new Token(tokenId, 'tokenMetadataUrl', tokenMetadata);

    // TODO:
    // - Create a URL either on S3 or on IPFS
    // - const newMetadata = {"name" : name, "description" : description, "image" : image}
    // - const jsonTokenMetadata = JSON.stringify(metadata);
    // - Run the code in onUpdateTokenUrlClicked()

    // HACK to fix linting errors - I don't want to start commenting a bunch of temporarily unused code
    if (tokenId === 10000) {
      setNewTokenUrl('new');
      onUpdateTokenUrlClicked();
    }
    setToken(updatedToken);
  };

  // TODO: Merge in the following function into onUpdateMetadataClicked() such that we are creating a new Token URL every time...
  const onUpdateTokenUrlClicked = async (): Promise<void> => {
    setNewTokenSettingResult(null);
    const tokenId = Number(props.tokenId);
    try {
      await contract.methods.setTokenURI(tokenId, newTokenUrl)
        .send({ from: tokenOwner })
        .on('transactionHash', (transactionHash: string) => {
          setNewTokenSettingResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transactionHash}.` });
        })
        .on('confirmation', () => { // confirmationNumber, receipt
          setNewTokenSettingResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
          loadToken();
        });
    } catch (error) {
      setNewTokenSettingResult({ isSuccess: false, isPending: false, message: error.message });
    }
  };

  const onOpenseaClicked = () => {
    if (!token) {
      return;
    }
    // @ts-ignore
    window.open(`https://testnets.opensea.io/assets/${window.KRT_CONTRACT_ADDRESS}/${token.tokenId}`);
  };

  const onRaribleClicked = () => {
    if (!token) {
      return;
    }
    // @ts-ignore
    window.open(`https://rinkeby.rarible.com/token/${window.KRT_CONTRACT_ADDRESS}:${token.tokenId}`);
  };

  const onEtherscanClicked = () => {
    if (!token) {
      return;
    }
    // @ts-ignore
    window.open(`https://rinkeby.etherscan.io/token/${window.KRT_CONTRACT_ADDRESS}?a=${token.tokenId}`);
  };

  const onBackClicked = () => {
    navigator.navigateTo('/');
  };

  const inputState = (!newTokenSettingResult || newTokenSettingResult.isPending) ? undefined : newTokenSettingResult?.isSuccess ? 'success' : (newTokenSettingResult?.isSuccess === false ? 'error' : undefined);

  return (
    <React.Fragment>
      <Helmet>
        <title>{'Token | The Million Dollar Token Page'}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        { !token ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box
              maxHeight='350px'
              variant='tokenHeader'
            >
              <Image
                // isFullWidth={true}
                isCenteredHorizontally={true}
                fitType={'cover'}
                source={token.metadata.imageUrl}
                alternativeText={`${token.metadata.name} image`}
              />
            </Box>
            <Spacing variant={PaddingSize.Wide3} />
            <ResponsiveContainingView sizeResponsive={{ base: 12, small: 10, medium: 8 }}>
              <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start}>
                <Stack.Item alignment={Alignment.Start}>
                  <Button variant='secondary' onClicked={onBackClicked} text='Back' iconLeft={<KibaIcon iconId='ion-chevron-back' />} />
                </Stack.Item>
                <Text variant='preheading'>{`Token #${token.tokenId}`}</Text>
                <Text variant='header1'>{token.metadata.name}</Text>
                <Spacing variant={PaddingSize.Wide1} />
                <Text>{token.metadata.description}</Text>
                <Spacing variant={PaddingSize.Wide2} />
                <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
                  <Button variant='secondary' onClicked={onOpenseaClicked} text='OpenSea' />
                  <Button variant='secondary' onClicked={onRaribleClicked} text='Rarible' />
                  <Button variant='secondary' onClicked={onEtherscanClicked} text='Etherscan' />
                </Stack>
                <Spacing variant={PaddingSize.Wide2} />
                { (accounts === null || !tokenOwner) ? (
                  <LoadingSpinner />
                ) : (accounts.includes(tokenOwner)) ? (
                  <React.Fragment>
                    <Text>You are the owner. Update your Token&apos;s metadata here:</Text>
                    <Spacing variant={PaddingSize.Default} />
                    <Form onFormSubmitted={onUpdateMetadataClicked}>
                      <Stack direction={Direction.Vertical} shouldAddGutters={true}>
                        <SingleLineInput
                          inputType={InputType.Text}
                          value={newName}
                          onValueChanged={setNewName}
                          inputWrapperVariant={inputState}
                          messageText={newTokenSettingResult?.message}
                          placeholderText='Name'
                        />
                        <SingleLineInput
                          inputType={InputType.Text}
                          value={newDescription}
                          onValueChanged={setNewDescription}
                          inputWrapperVariant={inputState}
                          messageText={newTokenSettingResult?.message}
                          placeholderText='Description'
                        />
                        <SingleLineInput
                          inputType={InputType.Url}
                          value={newImageUrl}
                          onValueChanged={setNewImageUrl}
                          inputWrapperVariant={inputState}
                          messageText={newTokenSettingResult?.message}
                          placeholderText='Image URL'
                        />
                        <Button variant='primary' text='Update' buttonType='submit' />
                      </Stack>
                    </Form>
                  </React.Fragment>
                ) : (<Text>{`Owned by: ${tokenOwner}`}</Text>
                )}
              </Stack>
            </ResponsiveContainingView>
            <Spacing variant={PaddingSize.Wide3} />
          </React.Fragment>
        )}
        <Spacing variant={PaddingSize.Default} />
      </Stack>
    </React.Fragment>
  );
};
