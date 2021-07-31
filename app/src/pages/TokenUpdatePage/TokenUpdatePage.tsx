import React from 'react';

import { Direction, Stack } from '@kibalabs/ui-react';
import { TokenUpdateForm, UpdateResult } from '../../components/TokenUpdateForm';
import { Helmet } from 'react-helmet';
import { useGlobals } from '../../globalsContext';

export type TokenUpdatePageProps = {
  tokenId: string;
}

export const TokenUpdatePage = (props: TokenUpdatePageProps): React.ReactElement => {
  const { contract, requester, apiClient, network } = useGlobals();

  const onImageFilesChosen = async (files: File[]): Promise<UpdateResult> => {
    // TODO(krishan711): ensure there is only one file
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
      return { isSuccess: true, message: `${presignedUpload.url}${presignedUpload.params.key.replace('${filename}', fileName)}` };
    } catch (error: unknown) {
      return { isSuccess: false, message: error.message };
    }
  };

  const onTokenUpdateFormSubmitted = async (newTitle: string | null, newDescription: string | null, newUrl: string | null, newImageUrl: string | null): Promise<TokenUpdateResult> => {
    const title = newTitle != null ? newTitle : gridItem.title;
    const description = newDescription != null ? newDescription : gridItem.description;
    const imageUrl = newImageUrl != null ? newImageUrl : gridItem.imageUrl;
    const url = newUrl != null ? newUrl : gridItem.url;
    const blockId = gridItem.blockId;
    const tokenMetadataUrl = await apiClient.uploadMetadataForToken(gridItem.network, gridItem.tokenId, title, description || null, imageUrl, url, blockId);

    if (!contract) {
      return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
    }

    const tokenId = Number(props.tokenId);
    try {
      const signerIndex = accountIds.indexOf(ownerId);
      if (signerIndex === -1) {
        return { isSuccess: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' };
      }
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      let transaction = null;
      if (contractWithSigner.setTokenURI) {
        transaction = await contractWithSigner.setTokenURI(tokenId, tokenMetadataUrl);
      } else if (contractWithSigner.setTokenContentURI) {
        transaction = await contractWithSigner.setTokenContentURI(tokenId, tokenMetadataUrl);
      } else {
        return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
      }
      return { isSuccess: false, message: `Transaction in progress. Hash is: ${transaction.hash}.` };
      // await transaction.wait();
      // return { isSuccess: true, message: '🚀 Transaction complete' };
      // apiClient.updateTokenDeferred(network, Number(props.tokenId));
      // loadToken();
    } catch (error) {
      return { isSuccess: false, message: error.message };
    }
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Token ${props.tokenId} | The Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        <TokenUpdateForm
          onTokenUpdateFormSubmitted={onTokenUpdateFormSubmitted}
          onImageFilesChosen={onImageFilesChosen}
        />
      </Stack>
    </React.Fragment>
  );
};
