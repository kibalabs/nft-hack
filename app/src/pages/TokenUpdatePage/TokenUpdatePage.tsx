import React from 'react';

import { KibaException, KibaResponse, RestMethod } from '@kibalabs/core';
import { Link } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, InputType, KibaIcon, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, TabBar, Text, TextAlignment, useColors } from '@kibalabs/ui-react';
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
  const [chainOwnerIds, setChainOwnerIds] = React.useState<Map<number, string> | null | undefined>(undefined);
  const [isUpdatingMultiple, setIsUpdatingMultiple] = React.useState<boolean>(false);
  const [transaction, setTransaction] = React.useState<ContractTransaction | null>(null);
  const [transactionReceipt, setTransactionReceipt] = React.useState<ContractReceipt | null>(null);
  const [requestHeight, setRequestHeight] = React.useState<number>(1);
  const [requestWidth, setRequestWidth] = React.useState<number>(1);
  const accounts = useAccounts();
  const accountIds = useAccountIds();

  const loadToken = React.useCallback(async (): Promise<void> => {
    setTokenMetadata(undefined);
    if (network === null || contract === null) {
      setTokenMetadata(null);
      return;
    }
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

  const loadOwners = React.useCallback(async (): Promise<void> => {
    setChainOwnerIds(undefined);
    if (network === null || contract === null) {
      setChainOwnerIds(null);
      return;
    }
    const tokenId = Number(props.tokenId);
    const tokenIds = [];
    if (isUpdatingMultiple) {
      for (let y = 0; y < requestHeight; y += 1) {
        for (let x = 0; x < requestWidth; x += 1) {
          tokenIds.push(tokenId + (y * 100) + x);
        }
      }
    } else {
      tokenIds.push(tokenId);
    }

    const chainOwnerIdPromises = tokenIds.map(async (internalTokenId: number): Promise<string | null> => {
      try {
        return await contract.ownerOf(internalTokenId);
      } catch (error: unknown) {
        if (!(error as Error).message.includes('nonexistent token')) {
          console.error(error);
        }
        return null;
      }
    });
    const retrievedChainOwnerIds = await Promise.all(chainOwnerIdPromises);
    const calculatedChainOwnerIds = tokenIds.reduce((accumulator: Map<number, string>, internalTokenId: number, index: number): Map<number, string> => {
      accumulator.set(internalTokenId, retrievedChainOwnerIds[index] as string);
      return accumulator;
    }, new Map<number, string>());
    setChainOwnerIds(calculatedChainOwnerIds);
  }, [props.tokenId, isUpdatingMultiple, network, contract, requestHeight, requestWidth]);

  React.useEffect((): void => {
    loadOwners();
  }, [loadOwners]);

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
    if (!contract || !tokenMetadata || !chainOwnerIds || !accounts || !accountIds) {
      return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
    }

    const tokenId = Number(props.tokenId);
    const chainOwnerId = chainOwnerIds.get(tokenId);
    const signerIndex = accountIds.indexOf(chainOwnerId || '0x0');
    if (signerIndex === -1) {
      return { isSuccess: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' };
    }

    let tokenMetadataUrls: string[];
    try {
      if (isUpdatingMultiple) {
        tokenMetadataUrls = await apiClient.createMetadataForTokenGroup(network, tokenId, requestWidth, requestHeight, title, description, imageUrl, url);
      } else {
        const tokenMetadataUrl = await apiClient.createMetadataForToken(network, tokenId, title, description, imageUrl, url);
        tokenMetadataUrls = [tokenMetadataUrl];
      }
    } catch (error: unknown) {
      if (error instanceof KibaException && error.statusCode === 500) {
        return { isSuccess: false, message: 'Failed to upload your metadata. Please refresh and try again.' };
      }
      throw error;
    }
    let newTransaction = null;
    try {
      const contractWithSigner = contract.connect(accounts[signerIndex]);
      if (isUpdatingMultiple && contractWithSigner.setTokenGroupContentURIs) {
        newTransaction = await contractWithSigner.setTokenGroupContentURIs(tokenId, requestWidth, requestHeight, tokenMetadataUrls);
      } else if (!isUpdatingMultiple && contractWithSigner.setTokenContentURI) {
        newTransaction = await contractWithSigner.setTokenContentURI(tokenId, tokenMetadataUrls[0]);
      } else if (!isUpdatingMultiple && contractWithSigner.setTokenURI) {
        newTransaction = await contractWithSigner.setTokenURI(tokenId, tokenMetadataUrls[0]);
      } else {
        return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
      }
    } catch (error) {
      return { isSuccess: false, message: error.message };
    }
    setTransaction(newTransaction);
    return { isSuccess: false, message: `Transaction in progress. Hash is: ${newTransaction.hash}.` };
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

  const onTabKeySelected = (tabKey: string): void => {
    setIsUpdatingMultiple(tabKey === 'multiple');
  };

  const onRequestHeightChanged = (value: string): void => {
    if (parseInt(value, 10)) {
      setRequestHeight(parseInt(value, 10));
    }
  };

  const onRequestWidthChanged = (value: string): void => {
    if (parseInt(value, 10)) {
      setRequestWidth(parseInt(value, 10));
    }
  };

  const unownedTokenIds = chainOwnerIds ? Array.from(chainOwnerIds.entries()).reduce((accumulator: number[], value: [number, string]): number[] => {
    if (value[1] == null || !accountIds || !accountIds.includes(value[1])) {
      accumulator.push(value[0]);
    }
    return accumulator;
  }, []) : [];
  const isOwnerOfTokens = unownedTokenIds.length === 0;

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Update Token ${props.tokenId} | Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        <Text variant='header2' alignment={TextAlignment.Center}>{`Update Token ${props.tokenId}`}</Text>
        <Link text='Go to token' target={`/tokens/${props.tokenId}`} />
        <Spacing />
        { (tokenMetadata === null || chainOwnerIds === null || chainOwnerIds === null || accountIds === null) ? (
          <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
        ) : (tokenMetadata === undefined || chainOwnerIds === undefined || chainOwnerIds === undefined || accountIds === undefined) ? (
          <LoadingSpinner />
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
          <React.Fragment>
            <TabBar selectedTabKey={isUpdatingMultiple ? 'multiple' : 'single'} onTabKeySelected={onTabKeySelected}>
              <TabBar.Item tabKey='single' text='Update single' />
              <TabBar.Item tabKey='multiple' text='Update multiple' isEnabled={contract && contract.setTokenGroupContentURIs} />
            </TabBar>
            { isUpdatingMultiple && (
              <React.Fragment>
                <Stack direction={Direction.Horizontal} shouldAddGutters={true} shouldWrapItems={true} childAlignment={Alignment.Center}>
                  <Text>Block height:</Text>
                  <Box width='5em'>
                    <SingleLineInput inputType={InputType.Number} value={String(requestHeight)} onValueChanged={onRequestHeightChanged} />
                  </Box>
                </Stack>
                <Stack direction={Direction.Horizontal} shouldAddGutters={true} shouldWrapItems={true} childAlignment={Alignment.Center}>
                  <Text>Block width:</Text>
                  <Box width='5em'>
                    <SingleLineInput inputType={InputType.Number} value={String(requestWidth)} onValueChanged={onRequestWidthChanged} />
                  </Box>
                </Stack>
              </React.Fragment>
            )}
            <TokenUpdateForm
              title={tokenMetadata.name}
              description={tokenMetadata.description || ''}
              url={tokenMetadata.url || ''}
              imageUrl={tokenMetadata.image || ''}
              onTokenUpdateFormSubmitted={onTokenUpdateFormSubmitted}
              onImageFilesChosen={onImageFilesChosen}
              isEnabled={isOwnerOfTokens}
            />
            {!isOwnerOfTokens && (
              <Text variant='error'>{`You don't own these tokens: ${unownedTokenIds}`}</Text>
            )}
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
