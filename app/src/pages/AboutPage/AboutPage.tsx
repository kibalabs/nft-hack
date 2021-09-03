import React from 'react';

import { Alignment, Box, Direction, Markdown, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';


export const AboutPage = (): React.ReactElement => {
  const mainText = `

**[Milliondollartokenpage.com](http://milliondollartokenpage.com) (MDTP) is [milliondollarhomepage.com](http://milliondollarhomepage.com) in the crypto era.**

Flex and find the latest in NFTs and the crypto world!

Show off and share what's hot in the space you own.

&nbsp;

**Easy to use! ⚙️**

Check out what's hot!

![Blocks](/assets/pixel-block.mp4)

Mint new blocks.

![Mint](/assets/minting-block.mp4)

Update blocks!

![Update](/assets/update-block.mp4)


Come join us now and own a piece of crypto history on milliondollartokenpage.com! ❤️
`;

const learnMoreText = `

**Want to learn more? 💡**

&nbsp;

**What's changed? ⌛**

When created in 2005 milliondollarhomepage acted as an advertising board on the internet, selling one million pixels on the web for $1 each. Back then the web was still very static and there were no digital native forms of transacting value so when pixels were bought and set, they could no longer be re-sold or updated.

Today the internet is a lot more fun to play with and cryptocurrencies like [Bitcoin](https://bitcoin.org/en/faq) and [Ethereum](https://ethereum.org/en/what-is-ethereum/) have ushered in a whole new age known as [Web3](https://ethereum.org/en/developers/docs/web2-vs-web3/) where digitally native money and assets, represented by [tokens](https://blog.coinbase.com/a-beginners-guide-to-ethereum-tokens-fbd5611fe30b) and [NFTs](https://opensea.io/blog/guides/non-fungible-tokens/), can be transacted openly [peer-to-peer](https://www.investopedia.com/terms/p/peertopeer-p2p-service.asp) across the internet. MDTP infuses these modern innovations into the original idea to build a much more fun and functional virtual space to share content on anything you like!

&nbsp;

**How does MDTP work? ⛩️**

MDTP has 10,000 blocks on a 1000 x 1000 2D grid represented by 10,000 NFTs on the Ethereum network. Each NFT can either be minted or bought second-hand from someone who's already minted it. Once owned, you can put any image within that block, along with a title, description and url to another website!

To mint new blocks and make use of Ethereum and Web3 technologies you need to have a Web3 enabled plugin like [Metamask](https://metamask.io/) or browser like [Brave](https://brave.com/), which has a native crypto wallet, and to have some cryptocurrency in your wallet. You'll need [Ether](https://ethereum.org/en/eth/) in your wallet to pay for the [minting fees](https://postergrind.com/how-much-does-it-cost-to-mint-an-nft/) of the NFT collection and [mining fees](https://www.coindesk.com/learn/ethereum-101/ethereum-mining-works) of the network. Simply select "mint" in the side-panel for a block that's not yet been minted and confirm the transaction.

Once you own the NFT that represents a block you can then change the image, title, description and url by clicking it and selecting "update token" on the side-panel. By connecting your wallet the site will recognises that you own that NFT and allow you to update the content associated with that block.

And its a simple as that, buy blocks as NFTs and share your website, work or creations in this digital content space with the entire world!

&nbsp;

**Why should I get involved? ⚖️**

MDTP's magic comes in using the Ethereum network to store data and token ownership, as you get the benefit of both (1) life beyond the developers, and (2) the ability to re-sell your blocks easily. Let's expand on these benefits...

The first relates to the fact that when data is written into the Ethereum blockchain its made [immutable](https://academy.binance.com/en/glossary/immutability). So even if a catastrophe topples our servers, as the sole owner of the NFT representing this block you will still have ownership and it will still point to the same data. So another developer could potentially build another website showing the same NFTs and your content would still show up identically as before.

Secondly, as an owner of this NFT, you can use external marketplace like [opensea](https://opensea.io/) to re-sell that block for whatever price you like. So if you have a block that someone else finds particularly desirable, they can bid up prices to buy them right off you, and an NFT you bought for say $100 could sell for $1000 or more depending on demand - the sky is the limit!

The more people know about the site the more demand will rise and subsequently the price of your NFTs! So make sure to share the site with your friends and followers using our handy share button in the menu!

  `;

  return (
    <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true} paddingVertical={PaddingSize.Wide3} paddingHorizontal={PaddingSize.Wide2} shouldAddGutters={true} defaultGutter={PaddingSize.Wide1}>
      <Text variant='header1'>{'Million Dollar Token Page'}</Text>
      <Markdown source={mainText} />
      <Spacing/>      
      <Box variant="fomoBar" height="1px" isFullWidth={true}/>
      <Spacing/>
      <Markdown source={learnMoreText} />
    </Stack>
  );
};
