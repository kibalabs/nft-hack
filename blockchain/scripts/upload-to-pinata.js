const pinataSDK = require('@pinata/sdk');

const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const content = {
  "name" : "Ethereum Name Service",
  "description" : "Human readable names for the Ethereum network. ENS provides one name for all of your addresses. No more copying and pasting long addresses. Use your ENS name to store all of your addresses and receive any cryptocurrency, token, or NFT.",
  "image" : "https://ens.domains/static/twitter-15f5ac87c0869746f58bf124e1e1b6e4.png"
}
const name = 'metadata-ens.json'

const pinOptions = {
  pinataMetadata: {
    name: name,
  },
};

pinata.pinJSONToIPFS(content, pinOptions).then((result) => {
  console.log(result);
}).catch((err) => {
  console.log(err);
});
