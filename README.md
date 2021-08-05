# Nft-Hack

https://nft-hack.kiba.dev/

Miro: https://miro.com/app/board/o9J_lS4yNAo=/

Figma: https://www.figma.com/file/bcJ986kLJy9OxW0mTQEDG8/Main?node-id=0%3A1

Eth-Rinkeby contract address: [0xeDa9C05612579ff3888C5dCd689566406Df54e01](https://rinkeby.etherscan.io/address/0xeDa9C05612579ff3888C5dCd689566406Df54e01)
New Eth-Rinkeby contract address: [0x19559Ac1471e2e4887d63c9363C85BF9f85Fdb67](https://rinkeby.etherscan.io/address/0x19559Ac1471e2e4887d63c9363C85BF9f85Fdb67)

MDTP address: 0xCE11D6fb4f1e006E5a348230449Dc387fde850CC

## Running locally

### Frontend

```
cd ./app
npm install
npm run start-dev
```

### Database

Run a database locally within docker with:
```
docker stop mdtpdb || true
docker rm mdtpdb || true
docker run --name mdtpdb -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:12.5
```

You should be able to login to your postgres (on something like https://tableplus.com/) with the credentials:
```
host: 127.0.0.1
port: 5432
username: postgres
password: password
database: mdtpdb
```
Run the scripts in ./dbschema in order (0, 1, 2) within the SQL tab of TablePlus

### API

If you don't have a local environment setup, create one in the ./api direction:
```
cd ./api
python3 -m venv .env
```

```
source ./dbschema/export_db.vars
cd ./api
source .env/bin/activate
pip install -r requirements.txt
./start-api-dev.sh
```
