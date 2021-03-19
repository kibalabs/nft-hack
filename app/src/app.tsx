import React from 'react';

import { Alignment, buildTheme, ContainingView, Direction, KibaApp, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';

// const requester = new Requester();
// const notdClient = new NotdClient(requester);
// const localStorageClient = new LocalStorageClient(window.localStorage);
// const tracker = new EveryviewTracker('017285d5fef9449783000125f2d5d330');
// tracker.trackApplicationOpen();

const theme = buildTheme();

export const App = hot((): React.ReactElement => {
  return (
    <KibaApp theme={theme}>
      <Helmet>
        <title>{'The Million Dollar NFT Page'}</title>
      </Helmet>
      <ContainingView>
        <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
          <Spacing variant={PaddingSize.Wide3} />
          <Text variant='header1'>The Million Dollar NFT Page</Text>
          <Spacing variant={PaddingSize.Default} />
        </Stack>
      </ContainingView>
    </KibaApp>
  );
});
