[![Coverage Status](https://coveralls.io/repos/github/windingtree/org.id/badge.svg?branch=master)](https://coveralls.io/github/windingtree/org.id?branch=master&v=2.0)

<a href="https://orgid.tech"><img src="https://github.com/windingtree/branding/raw/master/org.id/svg/org.id-logo.svg" height="50" alt="ORG.ID"></a>

## ORG.ID Líf Deposit

ORG.ID Deposit is Trustworthiness clue for the ORG.ID Protocol

### Mainnet

`<not_deployed_yet>` [full config](./.openzeppelin/main-LifDeposit.json)

**Warning: ownership should be transferred to [DAO](https://github.com/windingtree/dao).**

### Ropsten

`<not_deployed_yet>` [full config](./.openzeppelin/ropsten-LifDeposit.json)



## Usage

```sh
npm i @windingtree/org.id-lif-deposit
```
```javascript
// ABI
const { LifDepositContract, LifDepositInterfaceContract, addresses } = require('@windingtree/org.id-lif-deposit');
// Contract addresses
const { mainnet, ropsten } = addresses;
```

## Interface

[Auto-generated docs](./docs/LifDeposit.md).

## Development

### Setup

```sh
npm i
```

### Test

```sh
npm run test
npm run test ./<path_to_test_file>.js
```

### Test coverage

```sh
npm run coverage
```

### Linting

```sh
npm run lint

```
