import React from 'react';

import { Link } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Form, InputType, KibaIcon, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, Text, TextAlignment, useColors } from '@kibalabs/ui-react';
import { BigNumber, ContractReceipt, ContractTransaction, utils as etherUtils } from 'ethers';
import { Helmet } from 'react-helmet';

import { useAccountIds, useAccounts } from '../../accountsContext';
import { useGlobals } from '../../globalsContext';
import { getTransactionEtherscanUrl, NON_OWNER } from '../../util/chainUtil';

export type TokenMintPageProps = {
  tokenId: string;
}

export const TokenMintPage = (props: TokenMintPageProps): React.ReactElement => {
  const { contract, apiClient, network } = useGlobals();
  const [mintPrice, setMintPrice] = React.useState<BigNumber | undefined | null>(undefined);
  const [totalMintLimit, setTotalMintLimit] = React.useState<number | undefined | null>(undefined);
  const [singleMintLimit, setSingleMintLimit] = React.useState<number | undefined | null>(undefined);
  const [ownershipMintLimit, setOwnershipMintLimit] = React.useState<number | undefined | null>(undefined);
  const [userOwnedCount, setUserOwnedCount] = React.useState<number | undefined | null>(undefined);
  const [mintedCount, setMintedCount] = React.useState<number | undefined | null>(undefined);
  const [ownedTokenIds, setOwnedTokenIds] = React.useState<number[] | null | undefined>(undefined);
  const [balance, setBalance] = React.useState<BigNumber | undefined | null>(undefined);
  const [requestHeight, setRequestHeight] = React.useState<number>(1);
  const [requestWidth, setRequestWidth] = React.useState<number>(1);
  const [isMintingMultiple, setIsMintingMultiple] = React.useState<boolean>(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = React.useState<boolean>(false);
  const [transaction, setTransaction] = React.useState<ContractTransaction | null>(null);
  const [transactionError, setTransactionError] = React.useState<Error | null>(null);
  const [transactionReceipt, setTransactionReceipt] = React.useState<ContractReceipt | null>(null);
  const accounts = useAccounts();
  const accountIds = useAccountIds();
  const colors = useColors();

  const requestCount = isMintingMultiple ? (requestHeight * requestWidth) : 1;
  const totalPrice = mintPrice ? mintPrice.mul(requestCount) : undefined;
  const isOverSingleLimit = singleMintLimit ? requestCount > singleMintLimit : false;
  const isOverTotalLimit = (totalMintLimit && mintedCount) ? requestCount + mintedCount > totalMintLimit : false;
  const isOverOwnershipLimit = false; // (ownershipMintLimit && userOwnedCount) ? requestCount + userOwnedCount > ownershipMintLimit : false;
  const isOverBalance = (balance && totalPrice) ? balance < totalPrice : false;
  const hasMintedToken = ownedTokenIds ? ownedTokenIds.length > 0 : false;

  const relevantTokenIds = React.useMemo((): number[] => {
    const tokenId = Number(props.tokenId);
    const tokenIds = [];
    if (isMintingMultiple) {
      for (let y = 0; y < requestHeight; y += 1) {
        for (let x = 0; x < requestWidth; x += 1) {
          tokenIds.push(tokenId + (y * 100) + x);
        }
      }
    } else {
      tokenIds.push(tokenId);
    }
    return tokenIds;
  }, [props.tokenId, requestHeight, requestWidth, isMintingMultiple]);

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
    if (contract.mintPrice) {
      contract.mintPrice().then((retrievedMintPrice: BigNumber): void => {
        setMintPrice(retrievedMintPrice);
      }).catch((error: unknown) => {
        console.error(error);
        setMintPrice(null);
      });
    } else {
      console.error('Contract does not support mintPrice');
      setMintPrice(null);
    }
    if (contract.totalMintLimit) {
      contract.totalMintLimit().then((retrievedTotalMintLimit: number): void => {
        setTotalMintLimit(retrievedTotalMintLimit);
      }).catch((error: unknown) => {
        console.error(error);
        setTotalMintLimit(null);
      });
    } else {
      console.error('Contract does not support totalMintLimit');
      setTotalMintLimit(null);
    }
    if (contract.singleMintLimit) {
      contract.singleMintLimit().then((retrievedSingleMintLimit: number): void => {
        setSingleMintLimit(retrievedSingleMintLimit);
      }).catch((error: unknown) => {
        console.error(error);
        setSingleMintLimit(null);
      });
    } else {
      console.error('Contract does not support singleMintLimit');
      setSingleMintLimit(null);
    }
    if (contract.ownershipMintLimit) {
      contract.ownershipMintLimit().then((retrievedOwnershipMintLimit: number): void => {
        setOwnershipMintLimit(retrievedOwnershipMintLimit);
      }).catch((error: unknown) => {
        console.error(error);
        setOwnershipMintLimit(null);
      });
    } else {
      console.error('Contract does not support ownershipMintLimit');
      setOwnershipMintLimit(null);
    }
    if (contract.mintedCount) {
      contract.mintedCount().then((retrievedMintedCount: BigNumber): void => {
        setMintedCount(retrievedMintedCount.toNumber());
      }).catch((error: unknown) => {
        console.error(error);
        setMintedCount(null);
      });
    } else {
      console.error('Contract does not support mintedCount');
      setMintedCount(null);
    }
  }, [contract]);

  React.useEffect((): void => {
    loadData();
  }, [loadData]);

  const loadBalance = React.useCallback(async (): Promise<void> => {
    if (accounts === null || accountIds === null || contract === null) {
      setBalance(null);
      setUserOwnedCount(null);
      return;
    }
    setBalance(undefined);
    setUserOwnedCount(undefined);
    if (contract === undefined || accounts === undefined || accountIds === undefined) {
      return;
    }
    if (accounts.length === 0 || accountIds.length === 0) {
      setBalance(null);
      setUserOwnedCount(null);
      return;
    }
    accounts[0].getBalance().then((retrievedBalance: BigNumber): void => {
      setBalance(retrievedBalance);
    }).catch((error: unknown) => {
      console.error(error);
      setBalance(null);
    });
    if (contract.balanceOf) {
      contract.balanceOf(accountIds[0]).then((retrievedBalance: BigNumber): void => {
        setUserOwnedCount(retrievedBalance.toNumber());
      }).catch((error: unknown) => {
        console.error(error);
        setUserOwnedCount(null);
      });
    } else {
      console.error('Failed to get the userOwnedCount');
      setUserOwnedCount(null);
    }
  }, [accounts, accountIds, contract]);

  React.useEffect((): void => {
    loadBalance();
  }, [loadBalance]);

  const loadOwners = React.useCallback(async (): Promise<void> => {
    if (contract === null) {
      setOwnedTokenIds(null);
      return;
    }
    setOwnedTokenIds(undefined);
    if (contract === undefined) {
      return;
    }
    const chainOwnerIdPromises = relevantTokenIds.map(async (tokenId: number): Promise<string | null> => {
      try {
        return await contract.ownerOf(tokenId);
      } catch (error: unknown) {
        if (!(error as Error).message.includes('nonexistent token')) {
          console.error(error);
        }
        return null;
      }
    });
    const retrievedChainOwnerIds = await Promise.all(chainOwnerIdPromises);
    const calculatedOwnedTokenIds = relevantTokenIds.reduce((accumulator: number[], tokenId: number, index: number): number[] => {
      if (retrievedChainOwnerIds[index] && retrievedChainOwnerIds[index] !== NON_OWNER) {
        accumulator.push(tokenId);
      }
      return accumulator;
    }, []);
    setOwnedTokenIds(calculatedOwnedTokenIds);
  }, [contract, relevantTokenIds]);

  React.useEffect((): void => {
    loadOwners();
  }, [loadOwners]);

  const onMintMultipleClicked = (): void => {
    setIsMintingMultiple(true);
  };

  const onMintSingleClicked = (): void => {
    setIsMintingMultiple(false);
  };

  const onConfirmClicked = async (): Promise<void> => {
    if (!contract || !accounts) {
      return;
    }
    setTransaction(null);
    setIsSubmittingTransaction(true);
    const contractWithSigner = contract.connect(accounts[0]);
    let newTransaction = null;
    try {
      if (isMintingMultiple) {
        newTransaction = await contractWithSigner.mintTokenGroup(Number(props.tokenId), requestWidth, requestHeight);
      } else {
        newTransaction = await contractWithSigner.mintToken(Number(props.tokenId));
      }
    } catch (error: unknown) {
      setTransactionError(error as Error);
    }
    setTransaction(newTransaction);
    setIsSubmittingTransaction(false);
  };

  const waitForTransaction = React.useCallback(async (): Promise<void> => {
    if (transaction && network) {
      try {
        const receipt = await transaction.wait();
        setTransactionReceipt(receipt);
        relevantTokenIds.forEach((tokenId: number): void => {
          apiClient.updateTokenDeferred(network, tokenId);
        });
      } catch (error: unknown) {
        setTransactionError(new Error(`Transaction failed: ${error.message || 'Unknown error'}`));
        setTransaction(null);
      }
    }
  }, [transaction, apiClient, network, relevantTokenIds]);

  React.useEffect((): void => {
    waitForTransaction();
  }, [waitForTransaction]);

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

  return (
    <React.Fragment>
      <Helmet>
        <title>{`Mint Token ${props.tokenId} | Million Dollar Token Page`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true}>
        <Text variant='header2' alignment={TextAlignment.Center}>{`Mint Token ${props.tokenId}`}</Text>
        <Link text='Go to token' target={`/tokens/${props.tokenId}`} />
        <Spacing />
        { contract === null || network === null ? (
          <Text variant='error'>You can&apos;t mint tokens if you aren&apos;t connected to the network 🤪. Please connect using the button at the bottom of the page</Text>
        ) : mintPrice === null || totalMintLimit === null || singleMintLimit === null || mintedCount === null || balance === null || ownershipMintLimit === null || userOwnedCount === null ? (
          <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
        ) : contract === undefined || network === undefined || mintPrice === undefined || totalMintLimit === undefined || singleMintLimit === undefined || mintedCount === undefined || balance === undefined || ownershipMintLimit === undefined || userOwnedCount === undefined ? (
          <LoadingSpinner />
        ) : transactionReceipt ? (
          <React.Fragment>
            <KibaIcon iconId='ion-checkmark-circle' variant='extraLarge' _color={colors.success} />
            <Text>Token minted successfully 🎉</Text>
            <Spacing />
            <Text>Now let&apos;s update the content on your tokens</Text>
            <Button variant='primary' text='Update token 👉' target={`/tokens/${props.tokenId}/update`} />
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
          <Form isLoading={isSubmittingTransaction} onFormSubmitted={onConfirmClicked}>
            <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} paddingVertical={PaddingSize.Wide2} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide}>
              <Text variant='note' alignment={TextAlignment.Center}>{'You found an un-minted token, nice one! You\'re about to become a part of crypto history 🚀'}</Text>
              <Text alignment={TextAlignment.Center}>{`Current token price: Ξ${etherUtils.formatEther(mintPrice)}`}</Text>
              <Text alignment={TextAlignment.Center}>{`Connected account balance: Ξ${etherUtils.formatEther(balance)}`}</Text>
              <Spacing />
              { isMintingMultiple && (
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
              <Text alignment={TextAlignment.Center}>{`Minting ${requestCount} token${requestCount > 1 ? 's' : ''} for Ξ${etherUtils.formatEther(totalPrice as BigNumber)}`}</Text>
              { isMintingMultiple && (
                <Text variant='note' alignment={TextAlignment.Center}>Please note that minting multiple tokens raises the risk that your transaction clashes with someone else trying to buy the same tokens 👀</Text>
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
              { ownedTokenIds && hasMintedToken && (
                <Text variant='error'>{`These tokens have already been minted: ${ownedTokenIds.join(', ')}`}</Text>
              )}
              { transactionError && (
                <Text variant='error' alignment={TextAlignment.Center}>{String(transactionError.message)}</Text>
              )}
              <Stack direction={Direction.Horizontal} shouldAddGutters={true} shouldWrapItems={true} isFullWidth={true}>
                { isMintingMultiple ? (
                  <Button variant='secondary' text='Mint single' onClicked={onMintSingleClicked} />
                ) : (
                  <Button variant='secondary' text='Mint group' onClicked={onMintMultipleClicked} />
                )}
                <Stack.Item growthFactor={1} shrinkFactor={1}>
                  <Button variant='primary' text='Confirm' buttonType='submit' isEnabled={!isOverSingleLimit && !isOverTotalLimit && !isOverBalance && !isOverOwnershipLimit && !hasMintedToken} />
                </Stack.Item>
              </Stack>
            </Stack>
          </Form>
        )}
      </Stack>
    </React.Fragment>
  );
};
