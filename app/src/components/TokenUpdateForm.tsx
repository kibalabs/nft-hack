import React from 'react';

import { Box, Button, Checkbox, Direction, Form, InputType, MultiLineInput, SingleLineInput, Stack, Text } from '@kibalabs/ui-react';

import { Dropzone } from './dropzone';
import { MdtpImage } from './MdtpImage';

export type UpdateResult = {
  isSuccess: boolean;
  message: string;
}

interface ITokenUpdateFormProps {
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  isEnabled: boolean;
  onTokenUpdateFormSubmitted: (shouldUseIpfs: boolean, title: string, description: string | null, url: string | null, imageUrl: string | null) => Promise<UpdateResult>;
  onImageFilesChosen: (shouldUseIpfs: boolean, files: File[]) => Promise<UpdateResult>;
}

export const TokenUpdateForm = (props: ITokenUpdateFormProps): React.ReactElement => {
  const [title, setTitle] = React.useState<string>(props.title);
  const [description, setDescription] = React.useState<string | null>(props.description);
  const [url, setUrl] = React.useState<string | null>(props.url);
  const [imageUrl, setImageUrl] = React.useState<string | null>(props.imageUrl);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const [updatingTokenResult, setUpdatingTokenResult] = React.useState<UpdateResult | null>(null);
  const [isUpdatingToken, setIsUpdatingToken] = React.useState<boolean>(false);
  const [updatingImageResult, setUpdatingImageResult] = React.useState<UpdateResult | null>(null);
  const [shouldUseIpfs, setShouldUseIpfs] = React.useState<boolean>(true);

  const onTokenUpdateFormSubmitted = async (): Promise<void> => {
    setUpdatingTokenResult(null);
    setIsUpdatingToken(true);
    const result = await props.onTokenUpdateFormSubmitted(shouldUseIpfs, title, description, url, imageUrl);
    setUpdatingTokenResult(result);
    setIsUpdatingToken(false);
  };

  const onImageFilesChosen = async (files: File[]): Promise<void> => {
    setUpdatingImageResult(null);
    setIsUploadingImage(true);
    const result = await props.onImageFilesChosen(shouldUseIpfs, files);
    setUpdatingImageResult(result);
    setIsUploadingImage(false);
    onImageUrlChanged(result.isSuccess ? result.message : imageUrl);
  };

  const onShouldUseIpfsToggled = (): void => {
    setShouldUseIpfs(!shouldUseIpfs);
  };

  const onTitleChanged = (value: string): void => {
    setUpdatingTokenResult(null);
    setTitle(value);
  };

  const onDescriptionChanged = (value: string): void => {
    setUpdatingTokenResult(null);
    setDescription(value);
  };

  const onImageUrlChanged = (value: string | null): void => {
    setUpdatingTokenResult(null);
    setImageUrl(value);
  };

  const inputVariant = (!updatingTokenResult) ? undefined : updatingTokenResult?.isSuccess ? 'success' : (updatingTokenResult?.isSuccess === false ? 'error' : undefined);

  return (
    <Form onFormSubmitted={onTokenUpdateFormSubmitted} isLoading={isUpdatingToken}>
      <Stack direction={Direction.Vertical} shouldAddGutters={true}>
        <SingleLineInput
          inputType={InputType.Text}
          value={title}
          onValueChanged={onTitleChanged}
          inputWrapperVariant={inputVariant}
          placeholderText='Title'
        />
        <MultiLineInput
          value={description}
          onValueChanged={onDescriptionChanged}
          inputWrapperVariant={inputVariant}
          placeholderText='Description'
        />
        <SingleLineInput
          inputType={InputType.Url}
          value={url}
          onValueChanged={setUrl}
          inputWrapperVariant={inputVariant}
          placeholderText='URL'
        />
        {isUploadingImage ? (
          <Text>Uploading image...</Text>
        ) : (
          <React.Fragment>
            <Stack direction={Direction.Horizontal} isFullWidth={true} shouldAddGutters={true}>
              <Dropzone onFilesChosen={onImageFilesChosen} />
              <Stack.Item growthFactor={1} shrinkFactor={1}>
                <SingleLineInput
                  inputType={InputType.Url}
                  value={imageUrl}
                  onValueChanged={onImageUrlChanged}
                  inputWrapperVariant={inputVariant}
                  placeholderText='Image URL'
                />
              </Stack.Item>
              {imageUrl && (
                <Box height='2.5em' width='2.5em' isFullWidth={false}>
                  <MdtpImage source={imageUrl} alternativeText='Token image preview' />
                </Box>
              )}
            </Stack>
            {updatingTokenResult && !updatingTokenResult.isSuccess && (
              <Text variant='error'>{updatingTokenResult.message}</Text>
            )}
            {updatingImageResult && !updatingImageResult.isSuccess && (
              <Text variant='error'>{updatingImageResult.message}</Text>
            )}
          </React.Fragment>
        )}
        <Checkbox isChecked={shouldUseIpfs} text={'Upload to IPFS'} onToggled={onShouldUseIpfsToggled} />
        {shouldUseIpfs && (<Text variant='note'>IPFS storage works best with files below 3MB</Text>)}
        <Button variant='primary' text='Update' buttonType='submit' isEnabled={props.isEnabled} />
      </Stack>
    </Form>

  );
};
