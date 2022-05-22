/* eslint-disable camelcase */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, network } from 'hardhat'
import { utils } from 'ethers'
import { LifDeposit__factory, LifTest } from '../typechain'
import { TransactionRequest } from '@ethersproject/providers'
import { getProxyAdminFactory } from '@openzeppelin/hardhat-upgrades/dist/utils'

const LIF_DEPOSIT_PROXY = '0x7Fa6Ad0866Caa4aBdE8d60B905B3Ae60A3E0f014'
const PROXY_ADMIN = '0xf66eE7f8406ac8922010e8c23ED62D0be05AEC5e'
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

  // --- deploy contracts

  // lifdeposit implementation only
  const lifDepositDeploy = await deploy('LifDeposit', {
    from: deployer,
    log: true,
    autoMine: true
  })

  // liftest if testnet
  if (!network.config.live && !network.tags.forked) {
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

  if (!network.config.live && network.tags.forked) {
    const NUM_TOKENS = utils.parseEther('10000')
    ;[alice, bob, carol, gov, lifOwner, nonOwner, orgIdOwner, lifDepositOwner, organizationOwner, entityDirector].forEach(async (user) => {
      const storageSlot = utils.keccak256(utils.defaultAbiCoder.encode(['address', 'uint256'], [user, 51]))
      await network.provider.send('hardhat_setStorageAt', [
        '0x9C38688E5ACB9eD6049c8502650db5Ac8Ef96465', // proxyadmin
        storageSlot,
        utils.defaultAbiCoder.encode(['uint256'], [NUM_TOKENS])
      ])
    })
  }

  const proxyAdminFactory = await getProxyAdminFactory(hre)

  const tx: TransactionRequest = {
    from: COMMUNITY_MULTI_SIG,
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
  }
}

export default func
func.tags = ['LifDeposit']
