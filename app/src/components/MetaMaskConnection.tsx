import React from 'react';

import { Alignment, Box, Button, Direction, Image, Stack, Text } from '@kibalabs/ui-react';

import { useAccounts, useOnLinkAccountsClicked } from '../accountsContext';
import { useGlobals } from '../globalsContext';


export const MetaMaskConnection = (): React.ReactElement => {
  const { network } = useGlobals();
  const accounts = useAccounts();
  const onLinkAccountsClicked = useOnLinkAccountsClicked();

  const onConnectClicked = async (): Promise<void> => {
    await onLinkAccountsClicked();
  };

  return (
    <Box variant='overlay-horizontal' isFullWidth={false}>
      { !accounts ? (
        <Button
          variant={'primary'}
          text='Install Metamask'
          target={'https://metamask.io/'}
        />
      ) : (accounts.length === 0) ? (
        <Button
          variant={'primary'}
          text='Connect accounts'
          onClicked={onConnectClicked}
        />
      ) : (
        <Stack
          direction={Direction.Horizontal}
          shouldAddGutters={true}
          childAlignment={Alignment.Center}
          contentAlignment={Alignment.Center}
        >
          <Box height='15px' width='15px'>
            <Image source='/assets/connected.svg' alternativeText={'Connected indicator'} />
          </Box>
          <Text variant='note'>{`${accounts.length} connected ${accounts.length > 1 ? 'accounts' : 'account'}`}</Text>
          <Text variant='note'>{`(${network})`}</Text>
        </Stack>
      )}
    </Box>
  );
};
