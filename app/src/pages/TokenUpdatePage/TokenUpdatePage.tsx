import React from 'react';

import { Alignment, Direction, Markdown, PaddingSize, Stack, Text } from '@kibalabs/ui-react';


export const TokenUpdatePage = (): React.ReactElement => {

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Form onFormSubmitted={onUpdateTokenFormSubmitted} isLoading={isUpdatingToken}>
        <Stack direction={Direction.Vertical} shouldAddGutters={true}>
          <SingleLineInput
            inputType={InputType.Text}
            value={newTitle}
            onValueChanged={setNewTitle}
            inputWrapperVariant={updateInputState}
            placeholderText='Name'
          />
          <MultiLineInput
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
    </Stack>
  );
};
