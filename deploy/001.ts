/* eslint-disable camelcase */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, network } from 'hardhat'
import { utils } from 'ethers'
import { LifDeposit, LifDeposit__factory, LifTest } from '../typechain'
import { zeroPad } from 'ethers/lib/utils'
import { TransactionRequest } from '@ethersproject/providers'
import { getProxyAdminFactory } from '@openzeppelin/hardhat-upgrades/dist/utils'

const LIF_DEPOSIT_PROXY = '0x7Fa6Ad0866Caa4aBdE8d60B905B3Ae60A3E0f014'
const PROXY_ADMIN = '0x9068a8323b7d6cbc2831c54569981e3ba7b5862e'
const COMMUNITY_MULTI_SIG = '0x876969b13dcf884C13D4b4f003B69229E6b7966A'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments

  const {
    deployer,
    alice,
    bob,
    carol,
    gov,
    lifOwner,
    nonOwner,
    orgIdOwner,
    lifDepositOwner,
    organizationOwner,
    entityDirector
  } = await getNamedAccounts()

  // --- Account listing ---
  console.log(`Deployer: ${deployer}`)
  console.log(`Alice: ${alice}`)
  console.log(`Bob: ${bob}`)
  console.log(`Carol: ${carol}`)
  console.log(`Gov: ${gov}`)

  // if forked testnet, assume multisig isn't set as owner...
  if (!network.config.live && network.name === 'hardhat') {
    await network.provider.send('hardhat_setStorageAt', [
      PROXY_ADMIN, // proxyadmin
      '0x0',
      utils.hexlify(zeroPad(COMMUNITY_MULTI_SIG, 32), { hexPad: 'left' })
    ])
  }

  // --- deploy contracts

  // lifdeposit implementation only
  const lifDepositDeploy = await deploy('LifDeposit', {
    from: deployer,
    log: true,
    autoMine: true
  })

  // liftest if testnet
  if (!network.config.live) {
    const lifTestDeploy = await deploy('LifTest', {
      from: deployer,
      log: true,
      autoMine: true,
      args: [
        'Lif', 'LIF', 0, utils.parseEther('1000000')
      ]
    })

    // if deployed to forked testing environment, set up LifTest
    if (lifTestDeploy.newlyDeployed) {
      console.log(
        `Contract LifTest deployed at ${lifTestDeploy.address} using ${lifTestDeploy.receipt?.gasUsed} gas`
      )

      const lifTestFactory = await ethers.getContractFactory('LifTest')
      const lifTest = lifTestFactory.attach(lifTestDeploy.address) as LifTest

      // mint tokens to each address
      const NUM_TOKENS = utils.parseEther('10000')
      ;[alice, bob, carol, gov, lifOwner, nonOwner, orgIdOwner, lifDepositOwner, organizationOwner, entityDirector].forEach(async (user) => {
        await lifTest.mint(user, NUM_TOKENS)
      })
    }
  }

  const proxyAdminFactory = await getProxyAdminFactory(hre)

  const tx: TransactionRequest = {
    to: PROXY_ADMIN,
    value: 0,
    data: proxyAdminFactory.interface.encodeFunctionData('upgradeAndCall', [
      LIF_DEPOSIT_PROXY,
      lifDepositDeploy.address,
      LifDeposit__factory.createInterface().encodeFunctionData(
        'upgrade'
      )
    ])
  }

  console.log('Submit the following transaction via the community multi-sig:')
  console.log(tx)

  // if forked testnet, assume multisig isn't set as owner...
  if (!network.config.live && network.name === 'hardhat') {
    await network.provider.send('hardhat_setBalance', [
      COMMUNITY_MULTI_SIG,
      '0xfffffffffffffffffffffffffffff' // set arbitrarily large amount of ETH in multi-sig
    ])
    await network.provider.send('hardhat_impersonateAccount', [COMMUNITY_MULTI_SIG])

    const signer = await ethers.getSigner(COMMUNITY_MULTI_SIG)

    // --- Manually handle the upgrade
    const signedTx = await signer.populateTransaction(tx)
    const upgradeTx = await signer.sendTransaction(signedTx)
    const receipt = await upgradeTx.wait()

    console.log(receipt)
  }
}

export default func
func.tags = ['LifDeposit']
