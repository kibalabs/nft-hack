import React from "react";

import { Button, Direction, Form, InputType, MultiLineInput, SingleLineInput, Stack, Text } from "@kibalabs/ui-react";
import { Dropzone } from "./dropzone";

export type UpdateResult = {
  isSuccess: boolean;
  message: string;
}

interface ITokenUpdateFormProps {
  onTokenUpdateFormSubmitted: (title: string | null, description: string | null, url: string | null, imageUrl: string | null) => Promise<UpdateResult>;
  onImageFilesChosen: (files: File[]) => Promise<UpdateResult>;
}

export const TokenUpdateForm = (props: ITokenUpdateFormProps): React.ReactElement => {
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newUrl, setNewUrl] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const [updatingTokenResult, setUpdatingTokenResult] = React.useState<UpdateResult | null>(null);
  const [isUpdatingToken, setIsUpdatingToken] = React.useState<boolean>(false);
  const [updatingImageResult, setUpdatingImageResult] = React.useState<UpdateResult | null>(null);

  const onTokenUpdateFormSubmitted = async (): Promise<void> => {
    setUpdatingTokenResult(null);
    setIsUpdatingToken(true);
    const result = await props.onTokenUpdateFormSubmitted(newTitle, newDescription, newUrl, newImageUrl);
    setUpdatingTokenResult(result);
    setIsUpdatingToken(false);
  }

  const onImageFilesChosen = async (files: File[]): Promise<void> => {
    setUpdatingImageResult(null);
    setIsUploadingImage(true);
    const result = await props.onImageFilesChosen(files);
    setNewImageUrl(result.isSuccess ? result.message : null);
    setUpdatingImageResult(result);
    setIsUploadingImage(false);
  };

  const inputVariant = (!updatingTokenResult) ? undefined : updatingTokenResult?.isSuccess ? 'success' : (updatingTokenResult?.isSuccess === false ? 'error' : undefined);

  return (
    <Form onFormSubmitted={onTokenUpdateFormSubmitted} isLoading={isUpdatingToken}>
      <Stack direction={Direction.Vertical} shouldAddGutters={true}>
        <SingleLineInput
          inputType={InputType.Text}
          value={newTitle}
          onValueChanged={setNewTitle}
          inputWrapperVariant={inputVariant}
          placeholderText='Name'
        />
        <MultiLineInput
          value={newDescription}
          onValueChanged={setNewDescription}
          inputWrapperVariant={inputVariant}
          placeholderText='Description'
        />
        <SingleLineInput
          inputType={InputType.Url}
          value={newUrl}
          onValueChanged={setNewUrl}
          inputWrapperVariant={inputVariant}
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
              inputWrapperVariant={inputVariant}
              messageText={updatingTokenResult?.message}
              placeholderText='Image URL'
            />
            <Text variant='note'>OR</Text>
            <Dropzone onFilesChosen={onImageFilesChosen} />
            {updatingImageResult && !updatingImageResult.isSuccess && (
              <Text variant='error-note'>{updatingImageResult.message}</Text>
            )}
          </React.Fragment>
        )}
        <Button variant='primary' text='Update' buttonType='submit' />
      </Stack>
    </Form>

  );
}
