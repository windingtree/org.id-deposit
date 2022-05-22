import {
  ethers,
  getNamedAccounts,
  deployments,
  getUnnamedAccounts,
  network
} from 'hardhat'

import { setupUser, setupUsers } from './utils'

import { expect } from './chai-setup'
import { BigNumber, constants, utils } from 'ethers'

import { IERC20, IOrgIdLike, LifDeposit } from '../typechain'

const COMMUNITY_MULTI_SIG = '0x876969b13dcf884C13D4b4f003B69229E6b7966A'
const LIF_DEPOSIT_PROXY = '0x7Fa6Ad0866Caa4aBdE8d60B905B3Ae60A3E0f014'

const LIF1 = '0xeb9951021698b42e4399f9cbb6267aa35f82d59d'
const LIF2 = '0x9C38688E5ACB9eD6049c8502650db5Ac8Ef96465'
const ORGID = '0x6434DEC2f4548C2aA9D88E8Ff821f387be3D7F0D'

const ORIGINAL_LIF_BALANCE = utils.parseEther('12000')
const DEFAULT_DEPOSIT_VALUE = utils.parseEther('1000')

// Fixtures
const setup = deployments.createFixture(async () => {
  await deployments.fixture('LifDeposit')
  const {
    deployer,
    alice,
    bob,
    carol,
    lifOwner,
    orgIdOwner,
    lifDepositOwner,
    organizationOwner,
    entityDirector
  } = await getNamedAccounts()
  const contracts = {
    // lifDeposit: (await ethers.getContract('LifDeposit')) as LifDeposit,
    lifDeposit: (await ethers.getContractAt(
      'LifDeposit',
      LIF_DEPOSIT_PROXY
    )) as LifDeposit,
    lif1: (await ethers.getContractAt('IERC20', LIF1)) as IERC20,
    lif2: (await ethers.getContractAt('IERC20', LIF2)) as IERC20,
    orgId: (await ethers.getContractAt('IOrgIdLike', ORGID)) as IOrgIdLike
  }
  const users = await setupUsers(await getUnnamedAccounts(), contracts)

  await network.provider.send('hardhat_impersonateAccount', [
    COMMUNITY_MULTI_SIG
  ])

  return {
    users,
    deployer: await setupUser(deployer, contracts),
    alice: await setupUser(alice, contracts),
    bob: await setupUser(bob, contracts),
    carol: await setupUser(carol, contracts),
    gov: await setupUser(COMMUNITY_MULTI_SIG, contracts),
    lifOwner: await setupUser(lifOwner, contracts),
    orgIdOwner: await setupUser(orgIdOwner, contracts),
    lifDepositOwner: await setupUser(lifDepositOwner, contracts),
    organizationOwner: await setupUser(organizationOwner, contracts),
    entityDirector: await setupUser(entityDirector, contracts),
    ...contracts
  }
})

describe('LifDeposit', function () {
  let alice: { address: string } & {
    lifDeposit: LifDeposit;
    lif1: IERC20;
    lif2: IERC20;
    orgId: IOrgIdLike;
  }
  let bob: { address: string } & {
    lifDeposit: LifDeposit;
    lif1: IERC20;
    lif2: IERC20;
    orgId: IOrgIdLike;
  }
  let gov: { address: string } & {
    lifDeposit: LifDeposit;
    lif1: IERC20;
    lif2: IERC20;
    orgId: IOrgIdLike;
  }
  let organizationOwner: { address: string } & {
    lifDeposit: LifDeposit;
    lif1: IERC20;
    lif2: IERC20;
    orgId: IOrgIdLike;
  }
  let ORGANIZATION_1: string
  let ORGANIZATION_2: string

  const NON_EXIST_ORG = constants.HashZero

  beforeEach('load fixture', async () => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ({
      alice,
      bob,
      gov,
      organizationOwner
    } = await setup())

    // get the organization id
    ORGANIZATION_1 =
      await organizationOwner.orgId.callStatic.createOrganization(
        utils.keccak256(utils.toUtf8Bytes('org1')),
        constants.HashZero,
        'orgJsonUri',
        'orgJsonUriBackup1',
        'orgJsonUriBackup2'
      )
    ORGANIZATION_2 =
      await organizationOwner.orgId.callStatic.createOrganization(
        utils.keccak256(utils.toUtf8Bytes('org2')),
        constants.HashZero,
        'orgJsonUri',
        'orgJsonUriBackup1',
        'orgJsonUriBackup2'
      )

    // actually create the organizationId
    await organizationOwner.orgId.createOrganization(
      utils.keccak256(utils.toUtf8Bytes('org1')),
      constants.HashZero,
      'orgJsonUri',
      'orgJsonUriBackup1',
      'orgJsonUriBackup2'
    )

    // actually create the organizationId
    await organizationOwner.orgId.createOrganization(
      utils.keccak256(utils.toUtf8Bytes('org2')),
      constants.HashZero,
      'orgJsonUri',
      'orgJsonUriBackup1',
      'orgJsonUriBackup2'
    )
  })

  describe('Ownable behaviour', () => {
    describe('#transferOwnership(address)', () => {
      it('confirm owner is community multi-sig', async () => {
        expect(await gov.lifDeposit.owner()).to.be.equal(COMMUNITY_MULTI_SIG)
      })
      it('should fail if called by not an owner', async () => {
        await expect(
          alice.lifDeposit.transferOwnership(alice.address)
        ).to.be.revertedWith('Ownable: caller is not the owner')
      })

      it('should fail if new owner has zero address', async () => {
        await expect(
          gov.lifDeposit.transferOwnership(constants.AddressZero)
        ).to.be.revertedWith('Ownable: new owner is the zero address')
      })

      it('should transfer contract ownership', async () => {
        await expect(gov.lifDeposit.transferOwnership(alice.address))
          .to.emit(gov.lifDeposit, 'OwnershipTransferred')
          .withArgs(gov.address, alice.address)
      })
    })

    describe('#owner()', () => {
      it('should return contract owner', async () => {
        expect(await alice.lifDeposit.owner()).to.be.equal(gov.address)
      })
    })
  })

  describe('ERC165 interfaces', () => {
    it('should support IERC165 interface', async () => {
      expect(
        await alice.lifDeposit.supportsInterface('0x01ffc9a7')
      ).to.be.equal(true)
    })

    it('should support ownable interface', async () => {
      expect(
        await alice.lifDeposit.supportsInterface('0x7f5828d0')
      ).to.be.equal(true)
    })

    it('should support lifdeposit interface', async () => {
      expect(
        await alice.lifDeposit.supportsInterface('0xe936be58')
      ).to.be.equal(true)
    })
  })

  describe('Lif2 upgrade', () => {
    it('has no Lif1 balance', async () => {
      expect(await alice.lif1.balanceOf(alice.lifDeposit.address)).to.be.equal(
        0
      )
    })
    it('has the correct Lif2 balance', async () => {
      expect(await alice.lif2.balanceOf(alice.lifDeposit.address)).to.be.equal(
        ORIGINAL_LIF_BALANCE
      )
    })
    it('lifdeposit lif token address set correctly', async () => {
      expect(await alice.lifDeposit.getLifTokenAddress()).to.be.equal(LIF2)
    })
    it('cannot call upgrade again a second time', async () => {
      expect(await gov.lifDeposit.upgrade())
        .to.be.revertedWith('LifDeposit/token-already-set')
    })
    it('sample of balance preservations', async () => {
      expect(await alice.lifDeposit.balanceOf('0xe2c2ca3e9bd7c371c57cb97c50d6006b3e6b4eb26356894ecf0b50afc667c672'))
        .to.be.eq(utils.parseEther('1000'))
    })
  })

  describe('Lif deposit', () => {
    describe('#getLifTokenAddress()', () => {
      it('should return Lif token address', async () => {
        expect(await alice.lifDeposit.getLifTokenAddress()).to.be.equal(LIF2)
      })
    })

    describe('#addDeposit(bytes32,uint256)', () => {
      it('should fail if organization not found', async () => {
        await expect(
          organizationOwner.lifDeposit.addDeposit(
            NON_EXIST_ORG,
            DEFAULT_DEPOSIT_VALUE
          )
        ).to.be.revertedWith('LifDeposit: Organization not found')
      })

      it('should fail if called not by an organization owner or director', async () => {
        await expect(
          bob.lifDeposit.addDeposit(ORGANIZATION_1, DEFAULT_DEPOSIT_VALUE)
        ).to.be.revertedWith(
          'LifDeposit: action not authorized'
        )
      })

      it('should fail if zero value provided', async () => {
        await expect(
          organizationOwner.lifDeposit.addDeposit(
            ORGANIZATION_1,
            BigNumber.from(0)
          )
        ).to.be.revertedWith('LifDeposit: Invalid deposit value')
      })

      it('should fail if Lif token allowance not sufficient', async () => {
        await expect(
          organizationOwner.lifDeposit.addDeposit(
            ORGANIZATION_1,
            DEFAULT_DEPOSIT_VALUE
          )
        ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
      })

      it('should add deposit', async () => {
        await organizationOwner.lif2.approve(
          organizationOwner.lifDeposit.address,
          DEFAULT_DEPOSIT_VALUE
        )
        await //expect(
          organizationOwner.lifDeposit.addDeposit(
            ORGANIZATION_1,
            DEFAULT_DEPOSIT_VALUE
          )
        //).to.not.be.reverted
      })
    })

    describe('#balanceOf(uint256)', () => {
      it('should return 0 if no deposits has been added', async () => {
        expect(
          await alice.lifDeposit.balanceOf(ORGANIZATION_1)
        ).to.be.equal(0)
      })

      it('should return deposit value', async () => {
        await organizationOwner.lif2.approve(
          organizationOwner.lifDeposit.address,
          DEFAULT_DEPOSIT_VALUE
        )
        await organizationOwner.lifDeposit.addDeposit(
          ORGANIZATION_1,
          DEFAULT_DEPOSIT_VALUE
        )
        expect(
          await organizationOwner.lifDeposit.balanceOf(ORGANIZATION_1)
        ).to.be.equal(DEFAULT_DEPOSIT_VALUE)
      })
    })

    describe('#setWithdrawDelay(uint256)', () => {
      it('should fail if called not by an owner', async () => {
        await expect(
          alice.lifDeposit.setWithdrawDelay(6000)
        ).to.be.revertedWith('Ownable: caller is not the owner')
      })

      it('should change withdrawal delay', async () => {
        const delay = BigNumber.from(6000)
        await expect(gov.lifDeposit.setWithdrawDelay(delay))
          .to.emit(gov.lifDeposit, 'WithdrawDelayChanged')
          .withArgs(0, delay)
      })
    })

    describe('#getWithdrawDelay()', () => {
      it('should return withdrawDelay', async () => {
        expect(await alice.lifDeposit.getWithdrawDelay()).to.be.equal(0)
        const delay = BigNumber.from(6000)
        await expect(gov.lifDeposit.setWithdrawDelay(delay)).to.not.be.reverted
        expect(await alice.lifDeposit.getWithdrawDelay()).to.be.equal(delay)
      })
    })

    describe('#submitWithdrawalRequest(bytes32,uint256)', () => {
      const EXTRA_DEPOSIT_VALUE = utils.parseEther('1001')

      beforeEach(async () => {
        await organizationOwner.lif2.approve(
          organizationOwner.lifDeposit.address,
          DEFAULT_DEPOSIT_VALUE
        )
        await organizationOwner.lifDeposit.addDeposit(
          ORGANIZATION_1,
          DEFAULT_DEPOSIT_VALUE
        )
      })

      it('should fail if organization not found', async () => {
        await expect(
          organizationOwner.lifDeposit.submitWithdrawalRequest(
            constants.HashZero,
            DEFAULT_DEPOSIT_VALUE
          )
        ).to.be.revertedWith('LifDeposit: Organization not found')
      })

      it('should fail if called not by an organization owner or director', async () => {
        await expect(
          alice.lifDeposit.submitWithdrawalRequest(
            ORGANIZATION_1,
            DEFAULT_DEPOSIT_VALUE
          )
        ).to.be.revertedWith(
          'LifDeposit: action not authorized'
        )
      })

      it('should fail if zero withdrawal value has been sent', async () => {
        await expect(
          organizationOwner.lifDeposit.submitWithdrawalRequest(
            ORGANIZATION_1,
            BigNumber.from(0)
          )
        ).to.be.revertedWith('LifDeposit: Invalid withdrawal value')
      })

      it('should fail if deposit balance is insufficient to withdraw', async () => {
        await expect(
          organizationOwner.lifDeposit.submitWithdrawalRequest(
            ORGANIZATION_1,
            EXTRA_DEPOSIT_VALUE
          )
        ).to.be.revertedWith('LifDeposit: Insufficient balance')
      })

      it('should submit withdrawal request', async () => {
        await expect(
          organizationOwner.lifDeposit.submitWithdrawalRequest(
            ORGANIZATION_1,
            DEFAULT_DEPOSIT_VALUE
          )
        ).to.not.be.reverted
      })
    })

    describe('#getWithdrawalRequest(bytes32)', () => {
      beforeEach(async () => {
        await organizationOwner.lif2.approve(organizationOwner.lifDeposit.address, DEFAULT_DEPOSIT_VALUE.mul(2))
        await organizationOwner.lifDeposit.addDeposit(ORGANIZATION_1, DEFAULT_DEPOSIT_VALUE)
      })

      it('should return exists=false if organization not found', async () => {
        expect(await alice.lifDeposit.getWithdrawalRequest(
          constants.HashZero
        )).to.have.property('exists').and.eq(false)
      })

      it('should return exists=false withdrawal request not found', async () => {
        expect(await organizationOwner.lifDeposit.getWithdrawalRequest(ORGANIZATION_2))
          .to.have.property('exists').and.eq(false)
      })

      it('should return withdrawal request info', async () => {
        const tx = await organizationOwner.lifDeposit.submitWithdrawalRequest(ORGANIZATION_1, DEFAULT_DEPOSIT_VALUE)
        tx.wait(1).then(async () => {
          const request = await organizationOwner.lifDeposit.getWithdrawalRequest(ORGANIZATION_1)
          expect(request).to.have.property('exists').to.be.eq(true)
          expect(request).to.have.property('value').to.be.eq(DEFAULT_DEPOSIT_VALUE)
          expect(request).to.have.property('withdrawTime').to.be.eq(tx.timestamp)
        })
      })
    })

    describe('#withdrawDeposit(bytes32)', () => {
      beforeEach(async () => {
        // set some delay as on chain there isn't one presently
        await gov.lifDeposit.setWithdrawDelay(3600)
        await organizationOwner.lif2.approve(organizationOwner.lifDeposit.address, DEFAULT_DEPOSIT_VALUE)
        await organizationOwner.lifDeposit.addDeposit(ORGANIZATION_1, DEFAULT_DEPOSIT_VALUE)
        await organizationOwner.lifDeposit.submitWithdrawalRequest(ORGANIZATION_1, DEFAULT_DEPOSIT_VALUE)
      })
      it('should fail if organization not found', async () => {
        await expect(organizationOwner.lifDeposit.withdrawDeposit(constants.HashZero))
          .to.be.revertedWith('LifDeposit: Organization not found')
      })
      it('should fail if called not by organization owner or director', async () => {
        await expect(alice.lifDeposit.withdrawDeposit(ORGANIZATION_1))
          .to.be.revertedWith('LifDeposit: action not authorized')
      })
      it('should fail if withdrawal request not found', async () => {
        await expect(organizationOwner.lifDeposit.withdrawDeposit(ORGANIZATION_2))
          .to.be.revertedWith('LifDeposit: Withdrawal request not found')
      })
      it('should fail if withdrawal request delay period not passed', async () => {
        await expect(organizationOwner.lifDeposit.withdrawDeposit(ORGANIZATION_1))
          .to.be.revertedWith('LifDeposit: Withdrawal request delay period not passed')
      })
      it('should withdraw deposit', async () => {
        const request = await organizationOwner.lifDeposit.getWithdrawalRequest(ORGANIZATION_1)
        const ownerBalance = await organizationOwner.lif2.balanceOf(organizationOwner.address)
        const lifDepositBalance = await alice.lif2.balanceOf(alice.lifDeposit.address)
        await network.provider.send('evm_setNextBlockTimestamp', [request.withdrawTime.toNumber()])
        await organizationOwner.lifDeposit.withdrawDeposit(ORGANIZATION_1)
        expect(await organizationOwner.lif2.balanceOf(organizationOwner.address))
          .to.be.eq(ownerBalance.add(DEFAULT_DEPOSIT_VALUE))
        expect(await alice.lif2.balanceOf(alice.lifDeposit.address))
          .to.be.eq(lifDepositBalance.sub(DEFAULT_DEPOSIT_VALUE))
      })
    })
  })
})
