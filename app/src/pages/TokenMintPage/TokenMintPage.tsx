import React from 'react';

import { KibaException } from '@kibalabs/core';
import { useDeepCompareCallback, useNumberRouteParam } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Form, Head, InputType, KibaIcon, Link, LoadingSpinner, MarkdownText, PaddingSize, SingleLineInput, Spacing, Stack, Text, TextAlignment, useColors } from '@kibalabs/ui-react';
import { BigNumber, ContractReceipt, ContractTransaction, utils as etherUtils } from 'ethers';

import { useAccount, useWeb3 } from '../../accountsContext';
import { PresignedUpload } from '../../client';
import { TokenUpdateForm, UpdateResult } from '../../components/TokenUpdateForm';
import { useGlobals } from '../../globalsContext';
import { useSetTokenSelection } from '../../tokenSelectionContext';
import { getTransactionEtherscanUrl, NON_OWNER } from '../../util/chainUtil';
import { getTokenIds } from '../../util/gridItemUtil';

export const TokenMintPage = (): React.ReactElement => {
  const tokenId = useNumberRouteParam('tokenId');
  const { contract, apiClient, network, requester, web3StorageClient } = useGlobals();
  const colors = useColors();
  const account = useAccount();
  const web3 = useWeb3();
  const setTokenSelection = useSetTokenSelection();
  const [mintPrice, setMintPrice] = React.useState<BigNumber | undefined | null>(undefined);
  const [totalMintLimit, setTotalMintLimit] = React.useState<number | undefined | null>(undefined);
  const [singleMintLimit, setSingleMintLimit] = React.useState<number | undefined | null>(undefined);
  const [ownershipMintLimit, setOwnershipMintLimit] = React.useState<number | undefined | null>(undefined);
  const [userOwnedCount, setUserOwnedCount] = React.useState<number | undefined | null>(undefined);
  const [mintedCount, setMintedCount] = React.useState<number | undefined | null>(undefined);
  const [isSaleActive, setIsSaleActive] = React.useState<boolean | undefined | null>(undefined);
  const [ownedTokenIds, setOwnedTokenIds] = React.useState<number[] | null | undefined>(undefined);
  const [balance, setBalance] = React.useState<BigNumber | undefined | null>(undefined);
  const [requestHeight, setRequestHeight] = React.useState<number>(1);
  const [requestWidth, setRequestWidth] = React.useState<number>(1);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = React.useState<boolean>(false);
  const [transaction, setTransaction] = React.useState<ContractTransaction | null>(null);
  const [transactionError, setTransactionError] = React.useState<Error | null>(null);
  const [transactionReceipt, setTransactionReceipt] = React.useState<ContractReceipt | null>(null);
  const [updateError, setUpdateError] = React.useState<Error | null>(null);
  const [updateReceipt, setUpdateReceipt] = React.useState<boolean | null>(null);

  const requestCount = requestHeight * requestWidth;
  const totalPrice = mintPrice ? mintPrice.mul(requestCount) : undefined;
  const isOverSingleLimit = singleMintLimit ? requestCount > singleMintLimit : false;
  const isOverTotalLimit = (totalMintLimit && mintedCount) ? requestCount + mintedCount > totalMintLimit : false;
  const isOverOwnershipLimit = (ownershipMintLimit && userOwnedCount) ? requestCount + userOwnedCount > ownershipMintLimit : false;
  const isOverBalance = (balance && totalPrice) ? balance.sub(totalPrice).isNegative() : false;
  const isAnyTokenMinted = ownedTokenIds ? ownedTokenIds.length > 0 : false;
  const tokenIds = getTokenIds(tokenId, requestWidth, requestHeight);
  const hasMinted = transaction != null || transactionReceipt != null;

  const loadData = React.useCallback(async (): Promise<void> => {
    if (contract === null) {
      setMintPrice(null);
      setTotalMintLimit(null);
      setSingleMintLimit(null);
      setMintedCount(null);
      return;
    }
    setMintPrice(undefined);
    setTotalMintLimit(undefined);
    setSingleMintLimit(undefined);
    setMintedCount(undefined);
    if (contract === undefined) {
      return;
    }
    if (contract.isSaleActive) {
      contract.isSaleActive().then((retrievedIsSaleActive: boolean): void => {
        setIsSaleActive(retrievedIsSaleActive);
      }).catch((error: unknown) => {
        console.error(error);
        setIsSaleActive(null);
      });
    } else {
      console.error('Contract does not support isSaleActive');
      setIsSaleActive(true);
    }
    contract.mintPrice().then((retrievedMintPrice: BigNumber): void => {
      setMintPrice(retrievedMintPrice);
    }).catch((error: unknown) => {
      console.error(error);
      setMintPrice(null);
    });
    contract.totalMintLimit().then((retrievedTotalMintLimit: number): void => {
      setTotalMintLimit(retrievedTotalMintLimit);
    }).catch((error: unknown) => {
      console.error(error);
      setTotalMintLimit(null);
    });
    contract.singleMintLimit().then((retrievedSingleMintLimit: number): void => {
      setSingleMintLimit(retrievedSingleMintLimit);
    }).catch((error: unknown) => {
      console.error(error);
      setSingleMintLimit(null);
    });
    contract.ownershipMintLimit().then((retrievedOwnershipMintLimit: number): void => {
      setOwnershipMintLimit(retrievedOwnershipMintLimit);
    }).catch((error: unknown) => {
      console.error(error);
      setOwnershipMintLimit(null);
    });
    contract.mintedCount().then((retrievedMintedCount: BigNumber): void => {
      setMintedCount(retrievedMintedCount.toNumber());
    }).catch((error: unknown) => {
      console.error(error);
      setMintedCount(null);
    });
  }, [contract]);

  React.useEffect((): void => {
    loadData();
  }, [loadData]);

  const loadBalance = React.useCallback(async (): Promise<void> => {
    if (account === null || contract === null) {
      setBalance(null);
      setUserOwnedCount(null);
      return;
    }
    setBalance(undefined);
    setUserOwnedCount(undefined);
    if (contract === undefined || account === undefined) {
      return;
    }
    account.signer.getBalance().then((retrievedBalance: BigNumber): void => {
      setBalance(retrievedBalance);
    }).catch((error: unknown) => {
      console.error(error);
      setBalance(null);
    });
    contract.balanceOf(account.address).then((retrievedBalance: BigNumber): void => {
      setUserOwnedCount(retrievedBalance.toNumber());
    }).catch((error: unknown) => {
      console.error(error);
      setUserOwnedCount(null);
    });
  }, [account, contract]);

  React.useEffect((): void => {
    loadBalance();
  }, [loadBalance]);

  const loadOwners = useDeepCompareCallback(async (): Promise<void> => {
    if (contract === null) {
      setOwnedTokenIds(null);
      return;
    }
    setOwnedTokenIds(undefined);
    if (contract === undefined) {
      return;
    }
    const chainOwnerIdPromises = tokenIds.map(async (tokenID: number): Promise<string | null> => {
      try {
        return await contract.ownerOf(tokenID);
      } catch (error: unknown) {
        if (!(error as Error).message.includes('nonexistent token')) {
          console.error(error);
        }
        return null;
      }
    });
    const retrievedChainOwnerIds = await Promise.all(chainOwnerIdPromises);
    const calculatedOwnedTokenIds = tokenIds.reduce((accumulator: number[], tokenID: number, index: number): number[] => {
      if (retrievedChainOwnerIds[index] && retrievedChainOwnerIds[index] !== NON_OWNER) {
        accumulator.push(tokenID);
      }
      return accumulator;
    }, []);
    setOwnedTokenIds(calculatedOwnedTokenIds);
  }, [contract, tokenIds]);

  React.useEffect((): void => {
    loadOwners();
  }, [loadOwners]);

  const onConfirmClicked = async (): Promise<void> => {
    if (!contract || !account) {
      return;
    }
    setTransaction(null);
    setIsSubmittingTransaction(true);
    const contractWithSigner = contract.connect(account.signer);
    let newTransaction = null;
    try {
      if (requestCount > 1) {
        newTransaction = await contractWithSigner.mintTokenGroup(tokenId, requestWidth, requestHeight, { value: totalPrice });
      } else {
        newTransaction = await contractWithSigner.mintToken(tokenId, { value: totalPrice });
      }
    } catch (error: unknown) {
      setTransactionError(error as Error);
    }
    setTransaction(newTransaction);
    setIsSubmittingTransaction(false);
  };

  const waitForTransaction = useDeepCompareCallback(async (): Promise<void> => {
    if (transaction && network) {
      try {
        const receipt = await transaction.wait();
        setTransactionReceipt(receipt);
        tokenIds.forEach((tokenID: number): void => {
          apiClient.updateTokenDeferred(network, tokenID);
        });
      } catch (error: unknown) {
        setTransactionError(new Error(`Transaction failed: ${(error as Error).message || 'Unknown error'}`));
        setTransaction(null);
      }
    }
  }, [transaction, apiClient, network, tokenIds]);

  React.useEffect((): void => {
    waitForTransaction();
  }, [waitForTransaction]);

  React.useEffect((): void => {
    setTokenSelection(tokenIds);
  }, [setTokenSelection, tokenIds]);

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

  const onImageFilesChosen = async (shouldUseIpfs: boolean, files: File[]): Promise<UpdateResult> => {
    if (!network) {
      return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
    }
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
    let presignedUpload: PresignedUpload;
    try {
      presignedUpload = await apiClient.generateImageUploadForToken(network, tokenId);
    } catch (error: unknown) {
      return { isSuccess: false, message: `Failed to generate upload: ${(error as Error).message}` };
    }
    Object.keys(presignedUpload.params).forEach((key: string): void => {
      formData.set(key, presignedUpload.params[key]);
    });
    // eslint-disable-next-line no-template-curly-in-string
    formData.set('key', presignedUpload.params.key.replace('${filename}', fileName));
    formData.set('Content-Type', file.type);
    formData.append('file', file, file.name);
    try {
      await requester.makeFormRequest(presignedUpload.url, formData);
      // eslint-disable-next-line no-template-curly-in-string
      return { isSuccess: true, message: `${presignedUpload.url}${presignedUpload.params.key.replace('${filename}', fileName)}` };
    } catch (error: unknown) {
      return { isSuccess: false, message: (error as Error).message };
    }
  };

  const onTokenUpdateFormSubmitted = async (shouldUseIpfs: boolean, title: string, description: string | null, url: string | null, imageUrl: string | null): Promise<UpdateResult> => {
    if (!network || !contract || !account || !web3) {
      return { isSuccess: false, message: 'Could not connect to contract. Please refresh and try again.' };
    }
    if (!title) {
      return { isSuccess: false, message: 'Please update the title.' };
    }
    if (!imageUrl) {
      return { isSuccess: false, message: 'Please provide an image.' };
    }

    // const tokenId = tokenId;
    const isUpdatingMultiple = requestWidth > 1 || requestHeight > 1;
    let tokenMetadataUrls: string[];
    try {
      if (isUpdatingMultiple) {
        tokenMetadataUrls = await apiClient.createMetadataForTokenGroup(network, tokenId, shouldUseIpfs, requestWidth, requestHeight, title, description, imageUrl, url);
      } else {
        const tokenMetadataUrl = await apiClient.createMetadataForToken(network, tokenId, shouldUseIpfs, title, description, imageUrl, url);
        tokenMetadataUrls = [tokenMetadataUrl];
      }
    } catch (error: unknown) {
      if (error instanceof KibaException && error.statusCode === 500) {
        return { isSuccess: false, message: 'Failed to upload your metadata. Please refresh and try again.' };
      }
      throw error;
    }

    const blockNumber = await web3.getBlockNumber();
    const message = JSON.stringify({ network, tokenId, width: requestWidth, height: requestHeight, blockNumber, tokenMetadataUrls });
    let signature;
    try {
      signature = await account.signer.signMessage(message);
    } catch (error: unknown) {
      return { isSuccess: false, message: (error as Error).message };
    }
    const request = apiClient.updateOffchainContentsForTokenGroup(network, tokenId, requestWidth, requestHeight, blockNumber, tokenMetadataUrls, signature, true);
    try {
      await request;
      setUpdateReceipt(true);
      return { isSuccess: true, message: '' };
    } catch (error: unknown) {
      setUpdateError(error as Error);
      setUpdateReceipt(false);
      return { isSuccess: false, message: (error as Error).message };
    }
  };

  return (
    <React.Fragment>
      <Head headId='token-mint'>
        <title>{`Mint Token ${tokenId} | Million Dollar Token Page`}</title>
      </Head>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        <Text variant='header2' alignment={TextAlignment.Center}>{`Mint Token ${tokenId}`}</Text>
        <Link text='Go to token' target={`/tokens/${tokenId}`} />
        <Spacing />
        { contract === null || network === null ? (
          <Text variant='error'>You can&apos;t mint tokens if you aren&apos;t connected to the network 🤪. Please connect using the button at the bottom of the page</Text>
        ) : mintPrice === null || totalMintLimit === null || singleMintLimit === null || mintedCount === null || balance === null || ownershipMintLimit === null || userOwnedCount === null ? (
          <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
        ) : contract === undefined || network === undefined || mintPrice === undefined || totalMintLimit === undefined || singleMintLimit === undefined || mintedCount === undefined || balance === undefined || ownershipMintLimit === undefined || userOwnedCount === undefined ? (
          <LoadingSpinner />
        ) : !hasMinted ? (
          <Form isLoading={isSubmittingTransaction} onFormSubmitted={onConfirmClicked}>
            <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
              <Text alignment={TextAlignment.Center}>{'You found an un-minted token, nice! You\'re about to become part of crypto history 🚀'}</Text>
              <Spacing />
              <React.Fragment>
                <Stack direction={Direction.Horizontal} shouldAddGutters={true} shouldWrapItems={true} childAlignment={Alignment.Center}>
                  <Text>Block width:</Text>
                  <Box width='5em'>
                    <SingleLineInput inputType={InputType.Number} value={String(requestWidth)} onValueChanged={onRequestWidthChanged} />
                  </Box>
                </Stack>
                <Stack direction={Direction.Horizontal} shouldAddGutters={true} shouldWrapItems={true} childAlignment={Alignment.Center}>
                  <Text>Block height:</Text>
                  <Box width='5em'>
                    <SingleLineInput inputType={InputType.Number} value={String(requestHeight)} onValueChanged={onRequestHeightChanged} />
                  </Box>
                </Stack>
              </React.Fragment>
              <Stack.Item gutterAfter={PaddingSize.Narrow}>
                <Text variant='note' alignment={TextAlignment.Center}>{`Current token price: Ξ${etherUtils.formatEther(mintPrice)}`}</Text>
              </Stack.Item>
              <Stack.Item gutterAfter={PaddingSize.Narrow}>
                <Text variant='note' alignment={TextAlignment.Center}>{`Connected account balance: Ξ${Number(etherUtils.formatEther(balance)).toFixed(4)}`}</Text>
              </Stack.Item>
              <Text alignment={TextAlignment.Center}>{`Minting ${requestCount} token${requestCount > 1 ? 's' : ''} for Ξ${etherUtils.formatEther(totalPrice as BigNumber)}`}</Text>
              { requestCount > 1 && (
                <Text variant='note' alignment={TextAlignment.Center}>Please note that minting multiple tokens raises the risk that your transaction clashes with someone else trying to buy the same tokens 👀</Text>
              )}
              { !isSaleActive && (
                <Text variant='error' alignment={TextAlignment.Center}>Sale is not active yet. Please join our discord (https://discord.gg/bUeQjW4KSN) and we&apos;ll let you know when the sale is back on.</Text>
              )}
              { isOverSingleLimit && (
                <Text variant='error' alignment={TextAlignment.Center}>{`You can only mint ${singleMintLimit} tokens at once.`}</Text>
              )}
              { isOverTotalLimit && (
                <Text variant='error' alignment={TextAlignment.Center}>{`The current batch of tokens only has ${totalMintLimit - mintedCount} tokens left.`}</Text>
              )}
              { isOverBalance && (
                <Text variant='error' alignment={TextAlignment.Center}>{'You do not have enough Ξ in your connected wallet. Please add some funds, refresh and try again.'}</Text>
              )}
              { isOverOwnershipLimit && (
                <Text variant='error' alignment={TextAlignment.Center}>{'You have reached the ownership limit so you cannot mint more tokens at this time. If you\'re really keen reach out to the admins on our discord and we\'ll see what we can do 👀.'}</Text>
              )}
              { ownedTokenIds && isAnyTokenMinted && (
                <Text variant='error'>{`These tokens have already been minted: ${ownedTokenIds.join(', ')}`}</Text>
              )}
              { transactionError && (
                <Text variant='error' alignment={TextAlignment.Center}>{String(transactionError.message)}</Text>
              )}
              <Stack.Item growthFactor={1} shrinkFactor={1}>
                <Button variant='primary' text='Confirm' buttonType='submit' isEnabled={!!isSaleActive && !isOverSingleLimit && !isOverTotalLimit && !isOverBalance && !isOverOwnershipLimit && !isAnyTokenMinted} />
              </Stack.Item>
            </Stack>
          </Form>
        ) : (
          <React.Fragment>
            {transactionReceipt ? (
              <React.Fragment>
                <KibaIcon iconId='ion-checkmark-circle' variant='extraLarge' _color={colors.success} />
                <Text alignment={TextAlignment.Center}>🎉 Token minted successfully 🎉</Text>
              </React.Fragment>
            ) : transaction ? (
              <React.Fragment>
                <LoadingSpinner />
                <Text alignment={TextAlignment.Center}>Your transaction is going through.</Text>
                <Button
                  variant='invisibleNote'
                  text='View on etherscan'
                  target={getTransactionEtherscanUrl(network, transaction.hash) || ''}
                />
              </React.Fragment>
            ) : null}
            <Spacing />
            {updateReceipt ? (
              <Text variant='success' alignment={TextAlignment.Center}>We&apos;ve got your content. It will be set once the mint transaction is confirmed.</Text>
            ) : (
              <React.Fragment>
                <Text alignment={TextAlignment.Center}>Let&apos;s get your content up... 🎨</Text>
                <TokenUpdateForm
                  title={''}
                  description={''}
                  url={null}
                  imageUrl={null}
                  onTokenUpdateFormSubmitted={onTokenUpdateFormSubmitted}
                  onImageFilesChosen={onImageFilesChosen}
                  isEnabled={true}
                />
                { updateError && (
                  <Text variant='error' alignment={TextAlignment.Center}>{String(updateError.message)}</Text>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <Spacing variant={PaddingSize.Wide} />
        </Stack.Item>
        <MarkdownText textVariant='note' textAlignment={TextAlignment.Center} source='By minting a token you are agreeing to our [Terms of Sale](/assets/tos.pdf). Please take some time to read them!' />
      </Stack>
    </React.Fragment>
  );
};
