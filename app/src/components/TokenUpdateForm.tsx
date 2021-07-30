import React from "react";

import { Button, Direction, Form, InputType, SingleLineInput, Stack, Text } from "@kibalabs/ui-react";
import { useGlobals } from "../globalsContext";
import { Dropzone } from "./dropzone";

type TokenUpdateResult = {
  isPending: boolean;
  isSuccess: boolean;
  message: string;
}

interface ITokenUpdateFormProps {
  tokenId: string;
}

export const TokenUpdateFormPage = (props: ITokenUpdateFormProps): React.ReactElement => {
  const { apiClient, network, requester } = useGlobals();
  const [newTitle, setNewTitle] = React.useState<string | null>(null);
  const [newDescription, setNewDescription] = React.useState<string | null>(null);
  const [newUrl, setNewUrl] = React.useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState<boolean>(false);
  const [updatingTokenResult, setUpdatingTokenResult] = React.useState<TokenUpdateResult | null>(null);
  const [isUpdatingToken, setIsUpdatingToken] = React.useState<boolean>(false);

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

  const onUpdateTokenFormSubmitted = async (): Promise<void> => {
    setIsUpdatingToken(true);
    const title = newTitle != null ? newTitle : gridItem.title;
    const description = newDescription != null ? newDescription : gridItem.description;
    const image = newImageUrl != null ? newImageUrl : gridItem.imageUrl;
    const url = newUrl != null ? newUrl : gridItem.url;
    const blockId = gridItem.blockId;
    const tokenMetadataUrl = await apiClient.uploadMetadataForToken(gridItem.network, gridItem.tokenId, title, description || null, image, url, blockId);

    if (!contract) {
      setUpdatingTokenResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
      setIsUpdatingToken(false);
      return;
    }

    setUpdatingTokenResult(null);
    const tokenId = Number(props.tokenId);
    try {
      const signerIndex = accountIds.indexOf(ownerId);
      if (signerIndex === -1) {
        setUpdatingTokenResult({ isSuccess: false, isPending: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' });
        setIsUpdatingToken(false);
      }
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      let transaction = null;
      if (contractWithSigner.setTokenURI) {
        transaction = await contractWithSigner.setTokenURI(tokenId, tokenMetadataUrl);
      } else if (contractWithSigner.setTokenContentURI) {
        transaction = await contractWithSigner.setTokenContentURI(tokenId, tokenMetadataUrl);
      } else {
        setUpdatingTokenResult({ isSuccess: false, isPending: false, message: 'Could not connect to contract. Please refresh and try again.' });
        return;
      }
      setUpdatingTokenResult({ isSuccess: false, isPending: true, message: `Transaction in progress. Hash is: ${transaction.hash}.` });
      setIsUpdatingToken(false);
      await transaction.wait();
      setUpdatingTokenResult({ isSuccess: true, isPending: false, message: '🚀 Transaction complete' });
      apiClient.updateTokenDeferred(network, Number(props.tokenId));
      loadToken();
    } catch (error) {
      setUpdatingTokenResult({ isSuccess: false, isPending: false, message: error.message });
      setIsUpdatingToken(false);
    }
  };

  const updateInputState = (!updatingTokenResult || updatingTokenResult.isPending) ? undefined : updatingTokenResult?.isSuccess ? 'success' : (updatingTokenResult?.isSuccess === false ? 'error' : undefined);

  return (

  );
}
