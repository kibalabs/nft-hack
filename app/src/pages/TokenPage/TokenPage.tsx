import React from 'react';

import { useInitialization, useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Form, Image, InputType, KibaIcon, LoadingSpinner, PaddingSize, ResponsiveContainingView, SingleLineInput, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccounts } from '../../accountsContext';
import { GridItem, PresignedUpload } from '../../client';
import { Dropzone } from '../../components/dropzone';
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
  const { contract, contractAddress, requester, mdtpClient } = useGlobals();
  const navigator = useNavigator();
  const [gridItem, setGridItem] = React.useState<GridItem | null>(null);
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [newTokenSettingResult, setNewTokenSettingResult] = React.useState<Result | null>(null);
  const [hasStartedUpdated, setHasStartedUpdating] = React.useState<boolean>(false);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const accounts = useAccounts();

  React.useEffect((): void => {
    loadToken();
  }, [props.tokenId]);

  const loadToken = async (): Promise<void> => {
    const tokenId = Number(props.tokenId);
    mdtpClient.retrieveGridItem(tokenId).then((retrievedGridItem: GridItem): void => {
      setGridItem(retrievedGridItem);
    });
  };

  const onUpdateMetadataClicked = async (): Promise<void> => {
    if (!gridItem) {
      return;
    }

    setIsUpdating(true);
    // const title = newTitle != null ? newTitle : gridItem.title;
    // const description = newDescription != null ? newDescription : gridItem.description;
    // const image = newImageUrl != null ? newImageUrl : gridItem.imageUrl;
    // TODO(krishan711): upload this new metadata somewhere and set it as tokenMetadataUrl
    const tokenMetadataUrl = await contract.methods.tokenURI(gridItem.tokenId).call();

    setNewTokenSettingResult(null);
    const tokenId = Number(props.tokenId);
    try {
      await contract.methods.setTokenURI(tokenId, tokenMetadataUrl)
        .send({ from: gridItem.ownerId })
        .on('transactionHash', (transactionHash: string) => {
          setNewTokenSettingResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transactionHash}.` });
          setIsUpdating(false);
        })
        .on('confirmation', () => { // confirmationNumber, receipt
          setNewTokenSettingResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
          loadToken();
          setIsUpdating(false);
        });
    } catch (error) {
      setNewTokenSettingResult({ isSuccess: false, isPending: false, message: error.message });
      setIsUpdating(false);
    }
  };

  const onBackClicked = () => {
    navigator.navigateTo('/');
  };

  const onUpdateClicked = () => {
    setHasStartedUpdating(true);
  };

  const onImageFilesChosen = async (files: File[]): Promise<void> => {
    // TODO(krishan711): ensure there is only one file
    setIsUploadingImage(true);
    mdtpClient.generateImageUploadForToken(Number(props.tokenId)).then((presignedUpload: PresignedUpload): void => {
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

  const inputState = (!newTokenSettingResult || newTokenSettingResult.isPending) ? undefined : newTokenSettingResult?.isSuccess ? 'success' : (newTokenSettingResult?.isSuccess === false ? 'error' : undefined);

  return (
    <React.Fragment>
      <Helmet>
        <title>{'Token | The Million Dollar Token Page'}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        { !gridItem ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <ResponsiveContainingView sizeResponsive={{ base: 12, small: 10, medium: 8 }}>
              <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start}>
                <Stack.Item alignment={Alignment.Start}>
                  <Button variant='secondary' onClicked={onBackClicked} text='Back' iconLeft={<KibaIcon iconId='ion-chevron-back' />} />
                </Stack.Item>
                <Spacing variant={PaddingSize.Wide2} />
                <Box maxHeight='250px' variant='tokenHeader'>
                  <Image isCenteredHorizontally={true} fitType={'cover'} source={gridItem.imageUrl} alternativeText={`${gridItem.title} image`} />
                </Box>
                <Spacing variant={PaddingSize.Wide1} />
                <Text variant='header3'>{`TOKEN #${gridItem.tokenId}`}</Text>
                <Spacing variant={PaddingSize.Wide1} />
                <Text variant='preheading'>{'Name:'}</Text>
                <Text variant='header1'>{`${gridItem.title}`}</Text>
                <Spacing variant={PaddingSize.Wide1} />
                <Text>{`DESCRIPTION: ${gridItem.description}`}</Text>
                <Spacing variant={PaddingSize.Wide2} />
                <Stack direction={Direction.Horizontal} shouldAddGutters={true}>
                  <Button variant='secondary' target={`https://testnets.opensea.io/assets/${contractAddress}/${gridItem.tokenId}`} text='OpenSea' />
                  <Button variant='secondary' target={`https://rinkeby.etherscan.io/token/${contractAddress}?a=${gridItem.tokenId}`} text='Etherscan' />
                </Stack>
                <Spacing variant={PaddingSize.Wide2} />
                { (accounts === null || !gridItem.tokenId) ? (
                  <LoadingSpinner />
                ) : (accounts.includes(gridItem.ownerId)) ? (
                  <React.Fragment>
                    <Text>You are the owner. Update your Token&apos;s metadata here:</Text>
                    <Spacing variant={PaddingSize.Default} />
                    { !hasStartedUpdated ? (
                      <Button variant='primary' text='Update your token' onClicked={onUpdateClicked} />
                    ) : (
                      <Form onFormSubmitted={onUpdateMetadataClicked} isLoading={isUpdating}>
                        <Stack direction={Direction.Vertical} shouldAddGutters={true}>
                          <SingleLineInput
                            inputType={InputType.Text}
                            value={newTitle}
                            onValueChanged={setNewTitle}
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
                          {isUploadingImage ? (
                            <Text>Uploading image...</Text>
                          ) : (
                            <React.Fragment>
                              <SingleLineInput
                                inputType={InputType.Url}
                                value={newImageUrl}
                                onValueChanged={setNewImageUrl}
                                inputWrapperVariant={inputState}
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
                    )}
                  </React.Fragment>
                ) : (<Text>{`Owned by: ${gridItem.ownerId}`}</Text>
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
