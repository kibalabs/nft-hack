# Nft-Hack

https://nft-hack.kiba.dev/

Miro: https://miro.com/app/board/o9J_lS4yNAo=/

Figma: https://www.figma.com/file/bcJ986kLJy9OxW0mTQEDG8/Main?node-id=0%3A1

Rinkeby contract address: [0x9B84318C9aC64F564eEc4a703f2dbb742a4D1401](https://rinkeby.etherscan.io/address/0x9B84318C9aC64F564eEc4a703f2dbb742a4D1401)
New Rinkeby contract address: [0x7F042D0c65a891130621eA2fb5b7BbBDFD8C9cE2](https://rinkeby.etherscan.io/address/0x7F042D0c65a891130621eA2fb5b7BbBDFD8C9cE2)

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
