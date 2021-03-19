import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';

// const requester = new Requester();
// const notdClient = new NotdClient(requester);
// const localStorageClient = new LocalStorageClient(window.localStorage);
// const tracker = new EveryviewTracker('017285d5fef9449783000125f2d5d330');
// tracker.trackApplicationOpen();

const theme = buildThem()

export const App = hot((): React.ReactElement => {
  return (
    <KibaApp theme={theme}>
      <Helmet>
        <title>{`Token Hunt ${getTitleDateString()}`}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        <Spacing variant={PaddingSize.Wide3} />
        <Text variant='header1'>NFT of the day</Text>
        <Spacing variant={PaddingSize.Default} />
        <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} shouldAddGutters={true}>
          <IconButton icon={<KibaIcon iconId='ion-chevron-back' />} onClicked={onBackClicked} isEnabled={startDate > new Date(2021, 0, 1) } />
          <Text variant='header3'>{getDateString()}</Text>
          <IconButton icon={<KibaIcon iconId='ion-chevron-forward' />} onClicked={onForwardClicked} isEnabled={startDate < defaultDate} />
        </Stack>
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <Spacing variant={PaddingSize.Wide3} />
        </Stack.Item>
        <Container isFullHeight={false}>
          <EqualGrid isFullHeight={false} childSizeResponsive={{ base: 12, small: 6, large: 4, extraLarge: 3 }} contentAlignment={Alignment.Center} childAlignment={Alignment.Center} shouldAddGutters={true}>
            <RandomTokenTransferCard tokenTransfer={randomTokenTransfer} />
            <HighestPricedTokenTransferCard tokenTransfer={highestPricedTokenTransfer} />
            <MostTradedTokenTransferCard tokenTransfers={mostTradedTokenTransfers} />
            <SponsoredTokenCard token={sponsoredToken} />
          </EqualGrid>
        </Container>
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <Spacing variant={PaddingSize.Wide3} />
        </Stack.Item>
        <Text>Get your daily dose on:</Text>
        <Spacing variant={PaddingSize.Narrow} />
        <Stack direction={Direction.Horizontal} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} shouldAddGutters={true}>
          <Stack.Item growthFactor={1} shrinkFactor={1}>
            <Button variant='tertiary' text={'Twitter'} target={'https://twitter.com/tokenhunt'} iconLeft={<KibaIcon iconId='feather-twitter' />} />
          </Stack.Item>
          <Stack.Item growthFactor={1} shrinkFactor={1}>
            <Button variant='tertiary' text={'Instagram'} target={'https://instagram.com/tokenhunt'} iconLeft={<KibaIcon iconId='feather-instagram' />} />
          </Stack.Item>
          <Stack.Item growthFactor={1} shrinkFactor={1}>
            <Button variant='tertiary' text={'Email'} onClicked={onEmailClicked} iconLeft={<KibaIcon iconId='feather-mail' />} />
          </Stack.Item>
        </Stack>
        <Spacing />
        <Spacing />
        <MarkdownText textVariant='light' source='Data provided by [OpenSea](https://opensea.io/). Made by [Kiba Labs](https://www.kibalabs.com)' />
        <Spacing variant={PaddingSize.Narrow} />
      </Stack>
    </KibaApp>
  );
});
