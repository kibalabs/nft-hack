import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Button, Direction, KibaIcon, Markdown, PaddingSize, ResponsiveContainingView, Spacing, Stack, Text, LayerContainer } from '@kibalabs/ui-react';
import { ButtonsOverlay } from '../../components/ButtonsOverlay';
import { Helmet } from 'react-helmet';

export const AboutPage = (): React.ReactElement => {
  const navigator = useNavigator();

  const onHomeClicked = () => {
    navigator.navigateTo('/');
  };

  const text = `
  **What is Milliondollartokenpage?**

[Milliondollartokenpage.com](http://milliondollartokenpage.com) is [milliondollarhomepage.com](http://milliondollarhomepage.com) in the crypto era.

When created in 2005 milliondollarhomepage acted as an advertising board on the internet, selling one million pixels on the web for $1 each. Back then the web was still very static and there were no digital native forms of transacting value so when pixels were bought and set, they could no longer be re-sold or updated. 

Today the internet is a lot more fun to play with and cryptocurrencies like [Bitcoin](https://bitcoin.org/en/faq) and [Ethereum](https://ethereum.org/en/what-is-ethereum/) have ushered in a whole new age known as [Web3](https://ethereum.org/en/developers/docs/web2-vs-web3/) where digitally native money and assets, represented by [tokens](https://blog.coinbase.com/a-beginners-guide-to-ethereum-tokens-fbd5611fe30b) and [NFTs](https://opensea.io/blog/guides/non-fungible-tokens/), can be transacted openly [peer-to-peer](https://www.investopedia.com/terms/p/peertopeer-p2p-service.asp) across the internet. Milliondollartokenpage infuses these modern innovations into the original idea to build a much more fun and functional place to share images and ads on anything you like!

&nbsp;

**How does it work?**

Milliondollartokenpage has 10,000 blocks of 10x10 pixels represented by 10,000 NFTs on the Ethereum network. Each new pixel costs $1 and so each new block of 100 pixels costs $100 to buy. Once bought, you the owner can put any image in those pixels, along with a title, and description with links to other websites.

*[Image of a highlighted block of 10x10 pixels]*

To make use of Ethereum and Web3 technologies you need to have a Web3 enabled plugin like [Metamask](https://metamask.io/) or browser like [Brave](https://brave.com/), which has a native crypto wallet, and have some cryptocurrency in your wallet. You'll need [Ether](https://ethereum.org/en/eth/) in your wallet to pay the [mining fees](https://www.coindesk.com/learn/ethereum-101/ethereum-mining-works) associated with having a transaction be accepted by the network, and at least $100 in [ETH](https://ethereum.org/en/eth/) or [DAI](https://oasis.app/dai) to buy a block.

*[Image of a transaction in metamask buying a block]*

Once you own the NFT that represents a block of pixels you can then change the image, title and description by selecting the image and opening the appropriate token page. The website recognises when you own that block and will allow you to update the data stored in that block of pixels.

*[Image of Token Page - showing changing image, title, description - with Metamask transaction]*

And its a simple as that, buy as many pixels as you like and share your website, work or creations in this digital space with the entire world!

&nbsp;

**Why should I get involved?**

Milliondollartokenpage's magic comes in using the Ethereum network to store data and token ownership, as you get the benefit of both (1) life beyond the developers, and (2) the ability to re-sell your pixels easily. Let's expand on these benefits... 

The first relates to the fact that when data is written into the Ethereum blockchain its made [immutable](https://academy.binance.com/en/glossary/immutability). So even if a catastrophe topples over our milliondollartokenpage servers, you the sole owner of the NFT representing this block of pixels will still have ownership and it will still point to the same data. So another developer could potentially build another website showing the same NFTs and your pixels would still show up identically as before.

Secondly, as an owner of this NFT, you can use external marketplaces like [opensea](https://opensea.io/) or [rarible](https://rarible.com/) to re-sell that block of pixels for whatever price you like. So if you have some pixels right in the middle of the website that someone else finds particularly desirable, they can bid up prices to buy them right off you, and a 100 pixels you bought for $100 could sell for $1000 or more depending on demand, the sky is the limit!

We want you to spread the word to all your friends. So to sweeten the deal we're giving 10% of  purchasing fees when someone you recommended buys a block of pixels. This means that if a friend of yours buys 10 blocks for $1000 in total, then $100 of their cost will be reimbursed straight back to your wallet!

So come along and join us now by buying and sharing a piece of crypto history!
  `;

  return (
    <React.Fragment>
      <Helmet>
        <title>{'About | The Million Dollar Token Page'}</title>
      </Helmet>
      <LayerContainer>
        <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
          <Spacing variant={PaddingSize.Wide3} />
          <ResponsiveContainingView sizeResponsive={{ base: 12, small: 10, medium: 8 }}>
            <Stack direction={Direction.Vertical} childAlignment={Alignment.Center} contentAlignment={Alignment.Start}>
              <Stack.Item alignment={Alignment.Start}>
                <Button variant='secondary' onClicked={onHomeClicked} text='Home' iconLeft={<KibaIcon iconId='ion-chevron-back' />} />
              </Stack.Item>
              <Text variant='header1'>{'About'}</Text>
              <Spacing variant={PaddingSize.Wide3} />
              <Markdown source={text} />
            </Stack>
          </ResponsiveContainingView>
          <Spacing variant={PaddingSize.Wide3} />
        </Stack>
        <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.End}>
          <ButtonsOverlay />
        </LayerContainer.Layer>
      </LayerContainer>
    </React.Fragment>
  );
};
