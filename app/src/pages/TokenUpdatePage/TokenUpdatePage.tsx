import React from 'react';

import { KibaException, KibaResponse, RestMethod } from '@kibalabs/core';
import { Link } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, InputType, KibaIcon, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, TabBar, Text, TextAlignment, useColors } from '@kibalabs/ui-react';
import { ContractReceipt, ContractTransaction } from 'ethers';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { PresignedUpload, TokenMetadata } from '../../client';
import { TokenUpdateForm, UpdateResult } from '../../components/TokenUpdateForm';
import { useGlobals } from '../../globalsContext';
import { getTransactionEtherscanUrl } from '../../util/chainUtil';


export type TokenUpdatePageProps = {
  tokenId: string;
}

export const TokenUpdatePage = (props: TokenUpdatePageProps): React.ReactElement => {
  const { contract, requester, apiClient, network, web3StorageClient } = useGlobals();
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

  const relevantTokenIds = React.useMemo((): number[] => {
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
    return tokenIds;
  }, [props.tokenId, requestHeight, requestWidth, isUpdatingMultiple]);

  const loadToken = React.useCallback(async (): Promise<void> => {
    setTokenMetadata(undefined);
    // setTokenMetadataMap(undefined);
    if (network === null || contract === null || !contract.tokenContentURI) {
      setTokenMetadata(null);
      // setTokenMetadataMap(null);
      return;
    }
    setTokenMetadata(undefined);
    // setTokenMetadataMap(undefined);
    // NOTE(krishan711): this only works for the new contracts
    contract.tokenContentURI(Number(props.tokenId)).then((tokenMetadataUrl: string): void => {
      const url = tokenMetadataUrl.startsWith('ipfs://') ? tokenMetadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/') : tokenMetadataUrl;
      requester.makeRequest(RestMethod.GET, url).then((response: KibaResponse): void => {
        const tokenMetadataJson = JSON.parse(response.content);
        // NOTE(krishan711): this should validate the content cos if someone hasn't filled it correctly it could cause something bad
        setTokenMetadata(TokenMetadata.fromObject({ ...tokenMetadataJson, tokenId: Number(props.tokenId) }));
      });
    });
    // const metadataPromises = relevantTokenIds.map(async (tokenId: number): Promise<TokenMetadata | null> => {
    //   return contract.tokenContentURI(tokenId).then((tokenMetadataUrl: string): TokenMetadata => {
    //     const url = tokenMetadataUrl.startsWith('ipfs://') ? tokenMetadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/') : tokenMetadataUrl;
    //     return requester.makeRequest(RestMethod.GET, url).then((response: KibaResponse): TokenMetadata => {
    //       const tokenMetadataJson = JSON.parse(response.content);
    //       return TokenMetadata.fromObject({ ...tokenMetadataJson, tokenId: Number(props.tokenId) });
    //     });
    //   }).catch((error: unknown): void => {
    //     if (!(error as Error).message.includes('nonexistent token')) {
    //       console.error(error);
    //     }
    //     return null;
    //   });
    // });
    // const retrievedMetadataMap = await Promise.all(metadataPromises);
    // const calculatedMetadataMap = retrievedMetadataMap.reduce((accumulator: Map<number, TokenMetadata>, value: TokenMetadata | null): Map<number, TokenMetadata> => {
    //   if (value) {
    //     accumulator.set(Number(value.tokenId), value);
    //   }
    //   return accumulator;
    // }, new Map<number, TokenMetadata>());
    // setTokenMetadataMap(calculatedMetadataMap);
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
    setChainOwnerIds(undefined);
    const chainOwnerIdPromises = relevantTokenIds.map(async (internalTokenId: number): Promise<string | null> => {
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
    const calculatedChainOwnerIds = relevantTokenIds.reduce((accumulator: Map<number, string>, internalTokenId: number, index: number): Map<number, string> => {
      accumulator.set(internalTokenId, retrievedChainOwnerIds[index] as string);
      return accumulator;
    }, new Map<number, string>());
    setChainOwnerIds(calculatedChainOwnerIds);
  }, [network, contract, relevantTokenIds]);

  React.useEffect((): void => {
    loadOwners();
  }, [loadOwners]);

  const onImageFilesChosen = async (shouldUseIpfs: boolean, files: File[]): Promise<UpdateResult> => {
    // TODO(krishan711): ensure there is only one file
    const file = files[0];
    if (shouldUseIpfs) {
      try {
        const cid = await web3StorageClient.put([file], { wrapWithDirectory: false });
        return { isSuccess: true, message: `ipfs://${cid}` };
      } catch (error: unknown) {
        console.error(error);
        return { isSuccess: false, message: 'Failed to upload file to IPFS. Please try without IPFS whilst we look into what\'s happening.' };
      }
    }
    // @ts-ignore
    const fileName = file.path.replace(/^\//g, '');
    const formData = new FormData();
    formData.set('Content-Type', file.type);
    formData.append('file', file, file.name);
    let presignedUpload: PresignedUpload;
    try {
      presignedUpload = await apiClient.generateImageUploadForToken(network, Number(props.tokenId));
    } catch (error: unknown) {
      return { isSuccess: false, message: `Failed to generate upload: ${(error as Error).message}` };
    }
    Object.keys(presignedUpload.params).forEach((key: string): void => {
      formData.set(key, presignedUpload.params[key]);
    });
    // eslint-disable-next-line no-template-curly-in-string
    formData.set('key', presignedUpload.params.key.replace('${filename}', fileName));
    try {
      await requester.makeFormRequest(presignedUpload.url, formData);
      // eslint-disable-next-line no-template-curly-in-string
      return { isSuccess: true, message: `${presignedUpload.url}${presignedUpload.params.key.replace('${filename}', fileName)}` };
    } catch (error: unknown) {
      return { isSuccess: false, message: (error as Error).message };
    }
  };

  const onTokenUpdateFormSubmitted = async (shouldUseIpfs: boolean, title: string, description: string | null, url: string | null, imageUrl: string | null): Promise<UpdateResult> => {
    if (!contract || !tokenMetadata || !chainOwnerIds || !accounts || !accountIds) {
      return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
    }

    const tokenId = Number(props.tokenId);
    const chainOwnerId = chainOwnerIds.get(tokenId);
    const signerIndex = accountIds.indexOf(chainOwnerId || '0x0000000000000000000000000000000000000000');
    if (signerIndex === -1) {
      return { isSuccess: false, message: 'We failed to identify the account you need to sign this transaction. Please refresh and try again.' };
    }

    let tokenMetadataUrls: string[];
    try {
      if (isUpdatingMultiple) {
        if (!imageUrl) {
          return { isSuccess: false, message: 'To update multiple tokens you must provide an image.' };
        }
        tokenMetadataUrls = await apiClient.createMetadataForTokenGroup(network, tokenId, shouldUseIpfs, requestWidth, requestHeight, title, description, imageUrl, url );
      } else {
        const tokenMetadataUrl = await apiClient.createMetadataForToken(network, tokenId, shouldUseIpfs, title, description, imageUrl || tokenMetadata.image, url);
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
      relevantTokenIds.forEach((tokenId: number): void => {
        apiClient.updateTokenDeferred(network, tokenId);
      });
    }
  }, [transaction, apiClient, network, relevantTokenIds]);

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
        { (tokenMetadata === null || chainOwnerIds === null || accountIds === null) ? (
          <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
        ) : (tokenMetadata === undefined || accountIds === undefined) ? (
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
              <TabBar.Item tabKey='multiple' text='Update group' isEnabled={contract && contract.setTokenGroupContentURIs} />
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
              description={tokenMetadata.description}
              url={tokenMetadata.url}
              imageUrl={isUpdatingMultiple ? null : tokenMetadata.image}
              onTokenUpdateFormSubmitted={onTokenUpdateFormSubmitted}
              onImageFilesChosen={onImageFilesChosen}
              isEnabled={isOwnerOfTokens}
            />
            {!isOwnerOfTokens && (
              <Text variant='error'>{`You don't own these tokens: ${unownedTokenIds.join(', ')}`}</Text>
            )}
          </React.Fragment>
        )}
      </Stack>
    </React.Fragment>
  );
};
