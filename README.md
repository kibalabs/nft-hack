# Nft-Hack

https://nft-hack.kiba.dev/

Miro: https://miro.com/app/board/o9J_lS4yNAo=/

Figma: https://www.figma.com/file/bcJ986kLJy9OxW0mTQEDG8/Main?node-id=0%3A1

<!-- Eth-Rinkeby contract address: 0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3
Eth-Rinkeby contract url: https://rinkeby.etherscan.io/address/0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3 -->
Eth-Rinkeby contract address: 0xeDa9C05612579ff3888C5dCd689566406Df54e01
Eth-Rinkeby contract url: https://rinkeby.etherscan.io/address/0xeDa9C05612579ff3888C5dCd689566406Df54e01
Matic-Mumbai contract address: 0x87084477F7172dfC303A31efd33e9cA6eA8CABCE
Matic-Mumbai contract url: https://explorer-mumbai.maticvigil.com/address/0x87084477F7172dfC303A31efd33e9cA6eA8CABCE

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
