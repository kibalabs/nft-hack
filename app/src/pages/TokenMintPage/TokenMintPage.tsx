import React from 'react';

import { Link } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Form, InputType, KibaIcon, LoadingSpinner, PaddingSize, SingleLineInput, Spacing, Stack, Text, TextAlignment, useColors } from '@kibalabs/ui-react';
import { BigNumber, ContractReceipt, ContractTransaction, utils as etherUtils } from 'ethers';
import { Helmet } from 'react-helmet';

import { useAccounts } from '../../accountsContext';
import { useGlobals } from '../../globalsContext';
import { getTransactionEtherscanUrl } from '../../util/chainUtil';

export type TokenMintPageProps = {
  tokenId: string;
}

export const TokenMintPage = (props: TokenMintPageProps): React.ReactElement => {
  const { contract, apiClient, network } = useGlobals();
  const [mintPrice, setMintPrice] = React.useState<BigNumber | undefined | null>(undefined);
  const [totalMintLimit, setTotalMintLimit] = React.useState<number | undefined | null>(undefined);
  const [singleMintLimit, setSingleMintLimit] = React.useState<number | undefined | null>(undefined);
  const [mintedCount, setMintedCount] = React.useState<number | undefined | null>(undefined);
  const [chainOwnerId, setChainOwnerId] = React.useState<string | null | undefined>(undefined);
  const [balance, setBalance] = React.useState<BigNumber | undefined | null>(undefined);
  const [requestHeight, setRequestHeight] = React.useState<number>(1);
  const [requestWidth, setRequestWidth] = React.useState<number>(1);
  const [isMintingMultiple, setIsMintingMultiple] = React.useState<boolean>(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] = React.useState<boolean>(false);
  const [transaction, setTransaction] = React.useState<ContractTransaction | null>(null);
  const [transactionError, setTransactionError] = React.useState<Error | null>(null);
  const [transactionReceipt, setTransactionReceipt] = React.useState<ContractReceipt | null>(null);
  const accounts = useAccounts();
  const colors = useColors();

  const requestCount = isMintingMultiple ? (requestHeight * requestWidth) : 1;
  const totalPrice = mintPrice ? mintPrice.mul(requestCount) : undefined;
  const isOverSingleLimit = singleMintLimit ? requestCount > singleMintLimit : true;
  const isOverTotalLimit = (totalMintLimit && mintedCount) ? requestCount + mintedCount > totalMintLimit : true;
  const isOverBalance = (balance && totalPrice) ? balance < totalPrice : true;

  const loadData = React.useCallback(async (): Promise<void> => {
    if (network === null || contract === null) {
      setChainOwnerId(null);
      setMintPrice(null);
      return;
    }
    contract.ownerOf(Number(props.tokenId)).then((retrievedTokenOwner: string): void => {
      setChainOwnerId(retrievedTokenOwner);
    }).catch((error: Error): void => {
      if (!error.message.includes('nonexistent token')) {
        setChainOwnerId(null);
      }
    });
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
    if (contract.mintedCount) {
      contract.mintedCount().then((retrievedMintedCount: number): void => {
        setMintedCount(retrievedMintedCount);
      }).catch((error: unknown) => {
        console.error(error);
        setMintedCount(null);
      });
    } else {
      console.error('Contract does not support mintedCount');
      setMintedCount(null);
    }
  }, [network, contract, props.tokenId]);

  React.useEffect((): void => {
    loadData();
  }, [loadData]);

  const loadBalance = React.useCallback(async (): Promise<void> => {
    if (accounts) {
      accounts[0].getBalance().then((retrievedBalance: BigNumber): void => {
        setBalance(retrievedBalance);
      }).catch((error: unknown) => {
        console.error(error);
        setBalance(null);
      });
    } else {
      console.error('accounts is null');
      setBalance(null);
    }
  }, [accounts]);

  React.useEffect((): void => {
    loadBalance();
  }, [loadBalance]);

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
        newTransaction = await contractWithSigner.mintGroup(Number(props.tokenId), requestWidth, requestHeight);
      } else {
        newTransaction = await contractWithSigner.mint(Number(props.tokenId));
      }
    } catch (error: unknown) {
      setTransactionError(error as Error);
    }
    setTransaction(newTransaction);
    setIsSubmittingTransaction(false);
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
        { mintPrice === undefined || totalMintLimit === undefined || singleMintLimit === undefined || mintedCount === undefined || balance === undefined ? (
          <LoadingSpinner />
        ) : mintPrice === null || totalMintLimit === null || singleMintLimit === null || mintedCount === null || balance === null ? (
          <Text variant='error'>Something went wrong. Please check your accounts are connected correctly and try again.</Text>
        ) : chainOwnerId ? (
          <Text variant='error'>This token has already been bought. Please try to mint another.</Text>
        ) : transactionReceipt ? (
          <React.Fragment>
            <KibaIcon iconId='ion-checkmark-circle' variant='extraLarge' _color={colors.success} />
            <Text>Token minted successfully 🎉</Text>
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
              <Text alignment={TextAlignment.Center}>{`Connected account balance price: Ξ${etherUtils.formatEther(balance)}`}</Text>
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
              { transactionError && (
                <Text variant='error' alignment={TextAlignment.Center}>{String(transactionError.message)}</Text>
              )}
              <Stack direction={Direction.Horizontal} shouldAddGutters={true} shouldWrapItems={true}>
                { isMintingMultiple ? (
                  <Button variant='secondary' text='Mint single' onClicked={onMintSingleClicked} />
                ) : (
                  <Button variant='secondary' text='Mint multiple' onClicked={onMintMultipleClicked} />
                )}
                <Button variant='primary' text='Confirm' buttonType='submit' isEnabled={!isOverSingleLimit && !isOverTotalLimit && !isOverBalance} />
              </Stack>
            </Stack>
          </Form>
        )}
      </Stack>
    </React.Fragment>
  );
};
