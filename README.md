![Automated Linting and Unit Tests](https://github.com/windingtree/org.id-lif-deposit/workflows/Automated%20Linting%20and%20Unit%20Tests/badge.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/windingtree/org.id-lif-deposit/badge.svg?branch=master)](https://coveralls.io/github/windingtree/org.id-lif-deposit?branch=master)

<a href="https://orgid.tech"><img src="https://github.com/windingtree/branding/raw/master/org.id/svg/org.id-logo.svg" height="50" alt="ORGiD"></a>

## ORGiD Líf Deposit

ORGiD Deposit is Trustworthiness clue for the ORGiD Protocol

### Mainnet

`<not_deployed_yet>` [full config](./.openzeppelin/main-LifDeposit.json)

**Warning: ownership should be transferred to [DAO](https://github.com/windingtree/dao).**

### Ropsten

`0x77952566F96a3B9F8c9CaAFf6cc414fd5c2D1543` [full config](./.openzeppelin/ropsten-LifDeposit.json) v1.0.0



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
