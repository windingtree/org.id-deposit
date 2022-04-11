import { ethers, getNamedAccounts, deployments, getUnnamedAccounts, network } from 'hardhat'

import { setupUser, setupUsers } from './utils'

import { expect } from './chai-setup'
import { BigNumber, constants, utils } from 'ethers'

import { IERC20, LifDeposit, LifTest } from '../typechain'

const COMMUNITY_MULTI_SIG = '0x876969b13dcf884C13D4b4f003B69229E6b7966A'
const LIF_DEPOSIT_PROXY = '0x7Fa6Ad0866Caa4aBdE8d60B905B3Ae60A3E0f014'

const LIF1 = '0xeb9951021698b42e4399f9cbb6267aa35f82d59d'
const LIF2 = '0x9C38688E5ACB9eD6049c8502650db5Ac8Ef96465'

const ORIGINAL_LIF_BALANCE = utils.parseEther('12000')
const DEFAULT_DEPOSIT_VALUE = utils.parseEther('1000')

/*import { TestHelper } from '@openzeppelin/cli'
import { Contracts, ZWeb3 } from '@openzeppelin/upgrades'

import { assertRevert, assertEvent } from './helpers/assertions'
import { zeroAddress, zeroBytes, organizationUri, organizationHash } from './helpers/constants'
import { toWeiEther } from './helpers/common'
import { createOrganization } from './helpers/orgid'
import { setupToken, distributeLifTokens } from './helpers/lif'
import { addDeposit, submitWithdrawalRequest, withdrawDeposit } from './helpers/deposit'*/

/*
let gasLimit = 8000000 // Like actual to the Ropsten

const OrgId = Contracts.getFromNodeModules('@windingtree/org.id', 'OrgId')
const LifDeposit = Contracts.getFromLocal('LifDepositTimeMachine')
const LifDepositUpgradeability = Contracts.getFromLocal('LifDepositUpgradeability')

require('chai')
    .use(require('bn-chai')(web3.utils.BN))
    .should()

contract('LifDeposit', accounts => {
    const lifOwner = accounts[1]
    const nonOwner = accounts[2]
    const orgIdOwner = accounts[3]
    const lifDepositOwner = accounts[4]
    const organizationOwner = accounts[5]
    const entityDirector = accounts[6]

    const defaultWithdrawalDelay = '600000'
    const defaultDepositValue = toWeiEther('1000')

    let lifToken
    let project
    let orgId
    let lifDeposit

    const setupTokenAndDistribute = async () => {
        lifToken = await setupToken(lifOwner)
        await distributeLifTokens(
            lifToken,
            lifOwner,
            '10000',
            [
                organizationOwner,
                entityDirector
            ]
        )
    }

    const setupOrgId = async () => {
        await project.setImplementation(
            OrgId,
            'OrgId'
        )
        orgId = await project.createProxy(OrgId, {
            initMethod: 'initialize',
            initArgs: [
                orgIdOwner
            ]
        })
    }

    const setupLifDeposit = async () => {
        lifDeposit = await project.createProxy(LifDeposit, {
            initMethod: 'initialize',
            initArgs: [
                lifDepositOwner,
                orgId.address,
                lifToken.address
            ]
        })
        await lifDeposit
            .methods['setWithdrawDelay(uint256)'](defaultWithdrawalDelay)
            .send({ from: lifDepositOwner })
    }

    const setupOrganization = () => createOrganization(
        orgId,
        organizationOwner,
        organizationHash,
        organizationUri
    )

    before(async () => {
        await setupTokenAndDistribute()
        project = await TestHelper({
            from: orgIdOwner
        })
        await setupOrgId()
        await setupLifDeposit()
    })*/

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
        lifDeposit: (await ethers.getContractAt('LifDeposit', LIF_DEPOSIT_PROXY)) as LifDeposit,
        lifTest: (await ethers.getContract('LifTest')) as LifTest,
        lif1: (await ethers.getContractAt('IERC20', LIF1)) as IERC20,
        lif2: (await ethers.getContractAt('IERC20', LIF2)) as IERC20
    }
    const users = await setupUsers(await getUnnamedAccounts(), contracts)

    await network.provider.send('hardhat_impersonateAccount', [COMMUNITY_MULTI_SIG])

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
    let alice: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let bob: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let carol: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let gov: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let lifOwner: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let orgIdOwner: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let lifDepositOwner: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let organizationOwner: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }
    let entityDirector: { address: string } & { lifDeposit: LifDeposit, lifTest: LifTest, lif1: IERC20, lif2: IERC20 }

    beforeEach('load fixture', async () => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ; ({
            alice,
            bob,
            carol,
            gov,
            lifOwner,
            orgIdOwner,
            lifDepositOwner,
            organizationOwner,
            entityDirector
        } = await setup())
    })

    /*describe('Initializer', () => {
        it('should fail if orgId contract not supported ORGiD interface', async () => {
            await assertRevert(
                project.createProxy(LifDeposit, {
                    initMethod: 'initialize',
                    initArgs: [
                        lifDepositOwner,
                        lifToken.address, // wrong orgId contract
                        lifToken.address
                    ]
                })
            )
        })
    })*/

    describe('Ownable behaviour', () => {
        describe('#transferOwnership(address)', () => {
            it('confirm owner is community multi-sig', async () => {
                expect(await gov.lifDeposit.owner()).to.be.equal(COMMUNITY_MULTI_SIG)
            })
            it('should fail if called by not an owner', async () => {
                await expect(alice.lifDeposit.transferOwnership(alice.address)).to.be.revertedWith('Ownable: caller is not the owner')
            })

            it('should fail if new owner has zero address', async () => {
                await expect(gov.lifDeposit.transferOwnership(constants.AddressZero)).to.be.revertedWith('Ownable: new owner is the zero address')
            })

            it('should transfer contract ownership', async () => {
              await expect(
                gov.lifDeposit.transferOwnership(alice.address)
              )
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
            expect(await alice.lifDeposit.supportsInterface('0x01ffc9a7')).to.be.equal(true)
        })

        it('should support ownable interface', async () => {
            expect(await alice.lifDeposit.supportsInterface('0x7f5828d0')).to.be.equal(true)
        })

        it('should support lifdeposit interface', async () => {
            expect(await alice.lifDeposit.supportsInterface('0xe936be58')).to.be.equal(true)
        })
    })

    describe('Lif2 upgrade', () => {
        it('has no Lif1 balance', async () => {
            expect(await alice.lif1.balanceOf(alice.lifDeposit.address)).to.be.equal(0)
        })
        it('has the correct Lif2 balance', async () => {
            expect(await alice.lif2.balanceOf(alice.lifDeposit.address)).to.be.equal(ORIGINAL_LIF_BALANCE)
        })
        it('lifdeposit lif token address set correctly', async () => {
            expect(await alice.lifDeposit.getLifTokenAddress()).to.be.equal(LIF2)
        })
    })

    /*describe('Upgradeability behaviour', () => {
        after(async () => {
            await setupLifDeposit()
        })

        it('should upgrade proxy and reveal a new function and interface', async () => {
            lifDeposit = await project.upgradeProxy(
                lifDeposit.address,
                LifDepositUpgradeability,
                {
                    initMethod: 'initialize',
                    initArgs: []
                }
            )
            lifDeposit = await LifDepositUpgradeability.at(lifDeposit.address)
            await lifDeposit.methods['setupNewStorage(uint256)']('100').send({
                from: lifDepositOwner
            });
            (await lifDeposit.methods['newFunction()']().call()).should.equal('100');
            (
                await lifDeposit
                    .methods['supportsInterface(bytes4)']('0x1b28d63e')
                    .call()
            ).should.be.true
        })
    })*/

    describe('Lif deposit', () => {
        describe('#getLifTokenAddress()', () => {
            it('should return Lif token address', async () => {
                expect(await alice.lifDeposit.getLifTokenAddress()).to.be.equal(LIF2)
            })
        })

        describe('#addDeposit(bytes32,uint256)', () => {
            let organizationId: string

            before(async () => {
                organizationId = utils.formatBytes32String('N/A')
            })

            it('should fail if organization not found', async () => {
              await expect(
                organizationOwner.lifDeposit.addDeposit(
                  utils.formatBytes32String('N/A'),
                  DEFAULT_DEPOSIT_VALUE
                )
              ).to.be.revertedWith('LifDeposit: Organization not found')
            })

            it('should fail if called not by an organization owner or director', async () => {
                await expect(alice.lifDeposit.addDeposit(organizationId, DEFAULT_DEPOSIT_VALUE)).to.be.revertedWith('LifDeposit: action not authorized (must be owner or director)')
            })

            it('should fail if zero value provided', async () => {
                await expect(organizationOwner.lifDeposit.addDeposit(organizationId, BigNumber.from(0))).to.be.revertedWith('LifDeposit: Invalid deposit value')
            })

            it('should fail if Lif token allowance not sufficient', async () => {
                await expect(organizationOwner.lifDeposit.addDeposit(organizationId, DEFAULT_DEPOSIT_VALUE)).to.be.revertedWith('SafeERC20: low-level call failed')
            })

            it('should add deposit', async () => {
                await expect(organizationOwner.lifDeposit.addDeposit(organizationId, DEFAULT_DEPOSIT_VALUE)).to.not.be.reverted
            })
        })

        describe('#balanceOf(uint256)', () => {
            let organizationId: string

            before(async () => {
                organizationId = utils.formatBytes32String('N/A')
            })

            it('should return 0 if no deposits has been added', async () => {
                expect(await alice.lifDeposit.balanceOf(utils.formatBytes32String('N/A'))).to.be.equal(0)
            })

            it('should return deposit value', async () => {
                await organizationOwner.lifDeposit.addDeposit(organizationId, DEFAULT_DEPOSIT_VALUE)
                expect(await organizationOwner.lifDeposit.balanceOf(organizationId)).to.be.equal(DEFAULT_DEPOSIT_VALUE)
            })
        })

        describe('#setWithdrawDelay(uint256)', () => {
            it('should fail if called not by an owner', async () => {
                await expect(alice.lifDeposit.setWithdrawDelay(6000)).to.be.revertedWith('Ownable: caller is not the owner')
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
            let organizationId: string
            const EXTRA_DEPOSIT_VALUE = utils.parseEther('1001')

            before(async () => {
                organizationId = utils.formatBytes32String('REAL')
                await organizationOwner.lifDeposit.addDeposit(organizationId, DEFAULT_DEPOSIT_VALUE)
            })

            it('should fail if organization not found', async () => {
              await expect(
                organizationOwner.lifDeposit.submitWithdrawalRequest(
                  utils.formatBytes32String('N/A'),
                  DEFAULT_DEPOSIT_VALUE
                )
              ).to.be.revertedWith('LifDeposit: Organization not found')
            })

            it('should fail if called not by an organization owner or director', async () => {
              await expect(
                alice.lifDeposit.submitWithdrawalRequest(
                  organizationId,
                  DEFAULT_DEPOSIT_VALUE
                )
              ).to.be.revertedWith(
                'LifDeposit: action not authorized (must be owner or director)'
              )
            })

            it('should fail if zero withdrawal value has been sent', async () => {
              await expect(
                organizationOwner.lifDeposit.submitWithdrawalRequest(
                  organizationId,
                  BigNumber.from(0)
                )
              ).to.be.revertedWith('LifDeposit: Invalid withdrawal value')
            })

            it('should fail if deposit balance is insufficient to withdraw', async () => {
                await expect(
                    organizationOwner.lifDeposit.submitWithdrawalRequest(
                        organizationId,
                        EXTRA_DEPOSIT_VALUE
                    )
                ).to.be.revertedWith('LifDeposit: Insufficient balance')
            })

            it('should submit withdrawal request', async () => {
                await expect(
                    organizationOwner.lifDeposit.submitWithdrawalRequest(
                        organizationId,
                        DEFAULT_DEPOSIT_VALUE
                    )
                ).to.not.be.reverted
            })
        })

        describe('#getWithdrawalRequest(bytes32)', () => {
            let organizationId: string
            let organizationId2: string

            /*before(async () => {
                organizationId = utils.formatBytes32String('ORG1')
                organizationId2 = utils.formatBytes32String('ORG2')
                await organizationOwner.lifDeposit.addDeposit(organizationId, DEFAULT_DEPOSIT_VALUE)
                await organizationOwner.lifDeposit.addDeposit(organizationId2, DEFAULT_DEPOSIT_VALUE)
            })*/

            it('should return exists=false if organization not found', async () => {
                const { exists } = await alice.lifDeposit.getWithdrawalRequest(utils.formatBytes32String('N/A'))
                expect(exists).to.be.equal(false)
            })

            /*
            it('should return exists=false withdrawal request not found', async () => {
                (await lifDeposit
                    .methods['getWithdrawalRequest(bytes32)'](organizationId2)
                    .call()).should.has.property('exists').to.false
            })

            it('should return withdrawal request info', async () => {
                const request = await lifDeposit
                    .methods['getWithdrawalRequest(bytes32)'](organizationId)
                    .call();
                (await lifDeposit
                    .methods['getWithdrawalRequest(bytes32)'](organizationId)
                    .call()).should.has.property('exists').to.true;
                (request).should.be.an('object')
                    .that.has.property('value')
                    .to.equal(defaultDepositValue);
                (request).should.be.an('object')
                    .that.has.property('withdrawTime')
                    .to.equal(withdrawalRequest.withdrawTime)
            })
            */
        })

        /*
        describe('#withdrawDeposit(bytes32)', () => {
            let organizationId

            before(async () => {
                organizationId = await setupOrganization()
                await addDeposit(
                    lifDeposit,
                    organizationOwner,
                    organizationId,
                    defaultDepositValue,
                    lifToken
                )
                await submitWithdrawalRequest(
                    lifDeposit,
                    organizationOwner,
                    lifDepositOwner,
                    organizationId,
                    defaultDepositValue
                )
            })

            it('should fail if orgainzation not found', async () => {
                await assertRevert(
                    withdrawDeposit(
                        lifDeposit,
                        organizationOwner,
                        lifDepositOwner,
                        zeroBytes
                    ),
                    'LifDeposit: Organization not found'
                )
            })

            it('should fail if called not by organization owner or director', async () => {
                await assertRevert(
                    withdrawDeposit(
                        lifDeposit,
                        nonOwner,
                        lifDepositOwner,
                        organizationId
                    ),
                    'LifDeposit: action not authorized (must be owner or director)'
                )
            })

            it('should fail if withdrawal request not found', async () => {
                const organizationId2 = await setupOrganization()
                await assertRevert(
                    withdrawDeposit(
                        lifDeposit,
                        organizationOwner,
                        lifDepositOwner,
                        organizationId2
                    ),
                    'LifDeposit: Withdrawal request not found'
                )
            })

            it('should fail if withdrawal request delay period not passed', async () => {
                await assertRevert(
                    withdrawDeposit(
                        lifDeposit,
                        organizationOwner,
                        lifDepositOwner,
                        organizationId
                    ),
                    'LifDeposit: Withdrawal request delay period not passed'
                )
            })

            it('should withdraw deposit', async () => {
                await withdrawDeposit(
                    lifDeposit,
                    organizationOwner,
                    lifDepositOwner,
                    organizationId,
                    true // this option is rewinding time to the withdrawalTime
                )
            })
        })

        */
    })
})
