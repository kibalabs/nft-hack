# Migrating from MDTP v1 to v2

We knew going into web3 that mistakes are expensive.

We knew things are immutable.

But we hadn't actually run things in production.

Here's what we tried and how it went wrong.

<screenshot of code with payable instead of onlyOwner>

We were looking out for how people could "hack" the contract.

We tried to ensure that we could bypass our rules when needed.

We didn't think to add a "pause" so that nothing could move in the contract in case something went wrong.

We *almost* forgot to add a withdraw function which meant money would be locked in forever.

We added loads of tests to check things worked as we thought.

We didn't know about upgradable contracts.

I didn't realise we spent ~4x more on deployment than we should have because i hadn't enabled compiler optimisation.

## The problem

I made a typo in one of the functions. It means anyone can mint for free. It still costs gas so nobody is gonna do it too much and our mint price was still only 0.01eth so it's not like they are gonna run off with loads of money.

## The solution

Nice read on upgrade-ability: https://betterprogramming.pub/not-all-smart-contracts-are-immutable-create-upgradable-smart-contracts-e4e933b7b8a9

We deployed a new version. We added a bunch of stuff we wanted from the old one - cheaper minting and making it pausable, a new ERC spceification. We also removed a bunch of functions we never used.

### Migrating owners

A key challenge is migrating the old owners to the new contract. It works like this:

in the original contract lets say we have these tokens minted already:
```
#1 -> 0x123
#711 -> 0x456
#712 -> 0x456
#811 -> 0x456
#812 -> 0x456
#9011 -> 0x789
#9012 -> 0x789
```

so we have 7 tokens minted by three people. in the original contract this affects storage in a few places but the main one is in an array called `_owners` where it literally has a map from tokenId -> owner as shown above.

Populating this array directly into the new contract would not only be expensive but it would also break a number of ERC721 standards, most notably it would not automatically send out the `Transfer` event that many dapps rely on to monitor contracts.

All-in-all transposing the ownership from the old contract to the new would cost way over $50k at current eth prices. This is too much of a cost for us to bear as a young project.

The next ideal situation would be to point to the old contract for old tokens and to the new contract for new owners. However, we don't have a way to stop people from minting in the old contract so we would have to know exactly which tokens are part of the old batch and tell the new contract to point to the old ones for those.

The alternative we've designed is that the new looks to the old contract for a hardcoded list of tokens that we will specify. To do this when we initialise the contract we will set the old contract as the owner of the tokenIds that have already been minted.

This will cost us ~10k.

Unfortunately we haven't found a cheaper way of doing this so it's a cost we will have to bear.

One side effect of this is that our ownership is now split among two contracts. We have 1400 tokens owned in the old one and hopefully will have 8600 owned in the new.

In the future we are planning lots more functionality for owners of MDTP tokens, one of which is the $BUCK that you get for owning. Unfortunately it would mean that old owners wouldn't get these benefits.

To solve this, we've designed a process for the old owners to migrate their tokens to the new contract. If an owner transfers their token to the new contract they will be marked as the new owner.

We're also marking their tokens are OGs in our metadata so they can receive even more rewards and a special trait in their PFPFrame once it's released.
