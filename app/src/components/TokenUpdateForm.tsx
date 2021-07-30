import React from "react";

import { Button, Direction, Form, InputType, SingleLineInput, Stack, Text } from "@kibalabs/ui-react";
import Dropzone from "react-dropzone";
import { useGlobals } from "../globalsContext";

type TokenUpdateResult = {
  isPending: boolean;
  isSuccess: boolean;
  message: string;
}

interface ITokenUpdateFormProps {
  onTokenUpdateFormSubmitted: (title: string | null, description: string | null, url: string | null, imageUrl: string | null) => Promise<TokenUpdateResult>;
}

const TokenUpdateForm = (props: ITokenUpdateFormProps): React.ReactElement => {
  const { apiClient, network } = useGlobals();
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newUrl, setNewUrl] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const [updatingTokenResult, setUpdatingTokenResult] = React.useState<TokenUpdateResult | null>(null);
  const [isUpdatingToken, setIsUpdatingToken] = React.useState<boolean>(false);

  const onTokenUpdateFormSubmitted = async (): Promise<void> => {
    setIsUpdatingToken(true);
    const result = await props.onTokenUpdateFormSubmitted(newTitle, newDescription, newUrl, newImageUrl);
    setIsUpdatingToken(false);
    setUpdatingTokenResult(result);
  }

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

  const updateInputState = (!updatingTokenResult || updatingTokenResult.isPending) ? undefined : updatingTokenResult?.isSuccess ? 'success' : (updatingTokenResult?.isSuccess === false ? 'error' : undefined);

  return (
    <Form onFormSubmitted={onTokenUpdateFormSubmitted} isLoading={isUpdatingToken}>
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

  );
}
