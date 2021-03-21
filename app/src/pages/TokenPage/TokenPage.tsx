import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useInitialization } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Form, Image, InputType, LoadingSpinner, PaddingSize, ResponsiveContainingView, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
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
  const [token, setToken] = React.useState<Token | null>(null);
  const [tokenOwner, setTokenOwner] = React.useState<string | null>(null);
  const [newTokenUrl, setNewTokenUrl] = React.useState<string | null>(null);
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

  const inputState = (!newTokenSettingResult || newTokenSettingResult.isPending) ? undefined : newTokenSettingResult?.isSuccess ? 'success' : (newTokenSettingResult?.isSuccess === false ? 'error' : undefined);

  return (
    <React.Fragment>
      <Helmet>
        <title>{'Token | The Million NFT Page'}</title>
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
              variant='card'
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
            <Text>{`Token #${token.tokenId}`}</Text>
            <Text variant='header1'>{token.metadata.name}</Text>
            <Spacing variant={PaddingSize.Wide1} />
            <Text variant='header3'>{token.metadata.description}</Text>
            <Spacing variant={PaddingSize.Wide2} />
            <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
              <Button variant='secondary' onClicked={onOpenseaClicked} text='OpenSea' />
              <Button variant='secondary' onClicked={onRaribleClicked} text='Rarible' />
            </Stack>
            <Spacing variant={PaddingSize.Wide2} />
            { (accounts === null || !tokenOwner) ? (
              <LoadingSpinner />
            ) : (accounts.includes(tokenOwner)) ? (
              <React.Fragment>
                <Text>You are the owner. Use the form below to update your Token&apos;s metadata. </Text>
                <Spacing variant={PaddingSize.Default} />
                <ResponsiveContainingView sizeResponsive={{ base: 12, small: 8, medium: 6 }}>
                  <Form onFormSubmitted={onUpdateTokenUrlClicked}>
                    <Stack direction={Direction.Vertical}>
                      <SingleLineInput
                        inputType={InputType.Url}
                        value={newTokenUrl}
                        onValueChanged={setNewTokenUrl}
                        inputWrapperVariant={inputState}
                        messageText={newTokenSettingResult?.message}
                      />
                      <Button variant='primary' text='Update' buttonType='submit' />
                    </Stack>
                  </Form>
                </ResponsiveContainingView>
              </React.Fragment>
            ) : (
              <Text>{`Owned by: ${tokenOwner}`}</Text>
            )}
            <Spacing variant={PaddingSize.Wide3} />
          </React.Fragment>
        )}
        <Spacing variant={PaddingSize.Default} />
      </Stack>
    </React.Fragment>
  );
};
