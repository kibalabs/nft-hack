import React from 'react';

import { KibaResponse, RestMethod } from '@kibalabs/core';
import { Link } from '@kibalabs/core-react';
import { Alignment, Button, Direction, KibaIcon, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment, useColors } from '@kibalabs/ui-react';
import { ContractReceipt, ContractTransaction } from 'ethers';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { TokenMetadata } from '../../client';
import { TokenUpdateForm, UpdateResult } from '../../components/TokenUpdateForm';
import { useGlobals } from '../../globalsContext';
import { getTransactionEtherscanUrl } from '../../util/chainUtil';


export type TokenUpdatePageProps = {
  tokenId: string;
}

export const TokenUpdatePage = (props: TokenUpdatePageProps): React.ReactElement => {
  const { contract, requester, apiClient, network } = useGlobals();
  const colors = useColors();
  const [tokenMetadata, setTokenMetadata] = React.useState<TokenMetadata | null | undefined>(undefined);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null | undefined>(undefined);
  const [transaction, setTransaction] = React.useState<ContractTransaction | null>(null);
  const [transactionReceipt, setTransactionReceipt] = React.useState<ContractReceipt | null>(null);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const ownerId = chainOwnerId || null;
  const isOwnedByUser = ownerId && accountIds && accountIds.includes(ownerId);

  const loadToken = React.useCallback(async (): Promise<void> => {
    setTokenMetadata(undefined);
    setChainOwnerId(undefined);
    if (network === null || contract === null) {
      setTokenMetadata(null);
      setChainOwnerId(null);
      return;
    }
    contract.ownerOf(Number(props.tokenId)).then((retrievedTokenOwner: string): void => {
      setChainOwnerId(retrievedTokenOwner);
    }).catch((error: Error): void => {
      if (!error.message.includes('nonexistent token')) {
        console.error(error);
      }
      setTokenMetadata(null);
      setChainOwnerId(null);
    });
    // NOTE(krishan711): this only works for the new contracts
    if (contract.tokenContentURI) {
      contract.tokenContentURI(Number(props.tokenId)).then((tokenMetadataUrl: string): void => {
        requester.makeRequest(RestMethod.GET, tokenMetadataUrl).then((response: KibaResponse): void => {
          const tokenMetadataJson = JSON.parse(response.content);
          // NOTE(krishan711): this should validate the content cos if someone hasn't filled it correctly it could cause something bad
          setTokenMetadata(TokenMetadata.fromObject({ ...tokenMetadataJson, tokenId: Number(props.tokenId) }));
        });
      });
    }
  }, [props.tokenId, network, contract, requester]);

  React.useEffect((): void => {
    loadToken();
  }, [loadToken]);

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
      return { isSuccess: false, message: (error as Error).message };
    }
  };

  const onTokenUpdateFormSubmitted = async (title: string, description: string, url: string, imageUrl: string): Promise<UpdateResult> => {
    if (!contract || !tokenMetadata || !ownerId || !accounts || !accountIds) {
      return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
    }

    const tokenId = Number(props.tokenId);
    const blockId = tokenMetadata.blockId;
    const tokenMetadataUrl = await apiClient.uploadMetadataForToken(network, Number(props.tokenId), title, description, imageUrl, url, blockId);
    try {
      const signerIndex = accountIds.indexOf(ownerId);
      if (signerIndex === -1) {
        return { isSuccess: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' };
      }
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      let newTransaction = null;
      if (contractWithSigner.setTokenURI) {
        newTransaction = await contractWithSigner.setTokenURI(tokenId, tokenMetadataUrl);
      } else if (contractWithSigner.setTokenContentURI) {
        newTransaction = await contractWithSigner.setTokenContentURI(tokenId, tokenMetadataUrl);
      } else {
        return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
      }
      setTransaction(newTransaction);
      return { isSuccess: false, message: `Transaction in progress. Hash is: ${newTransaction.hash}.` };
    } catch (error) {
      return { isSuccess: false, message: error.message };
    }
  };

  const waitForTransaction = React.useCallback(async (): Promise<void> => {
    if (transaction) {
      const receipt = await transaction.wait();
      setTransactionReceipt(receipt);
      apiClient.updateTokenDeferred(network, Number(props.tokenId));
    }
  }, [transaction, apiClient, network, props.tokenId]);

  React.useEffect((): void => {
    waitForTransaction();
  }, [waitForTransaction]);

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Update Token ${props.tokenId} | Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        <Text variant='header2' alignment={TextAlignment.Center}>{`Update Token ${props.tokenId}`}</Text>
        <Link text='Go to token' target={`/tokens/${props.tokenId}`} />
        <Spacing />
        { (tokenMetadata === null || chainOwnerId === null) ? (
          <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
        ) : (tokenMetadata === undefined || chainOwnerId === undefined) ? (
          <LoadingSpinner />
        ) : (!isOwnedByUser) ? (
          <Text variant='error'>Your connected account is not the owner of this token. Please connect the correct account or go to another token.</Text>
        ) : transactionReceipt ? (
          <React.Fragment>
            <KibaIcon iconId='ion-checkmark-circle' variant='extraLarge' _color={colors.success} />
            <Text>Update successful</Text>
          </React.Fragment>
        ) : transaction ? (
          <React.Fragment>
            <LoadingSpinner />
            <Text>Your transaction is going through.</Text>
            <Button
              variant='secondary'
              text='View Transaction'
              target={getTransactionEtherscanUrl(network, transaction.hash) || ''}
            />
          </React.Fragment>
        ) : (
          <TokenUpdateForm
            title={tokenMetadata.name}
            description={tokenMetadata.description || ''}
            url={tokenMetadata.url || ''}
            imageUrl={tokenMetadata.image || ''}
            onTokenUpdateFormSubmitted={onTokenUpdateFormSubmitted}
            onImageFilesChosen={onImageFilesChosen}
          />
        )}
      </Stack>
    </React.Fragment>
  );
};
