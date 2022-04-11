// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import "../LifDeposit.sol";

/**
 * @title LifDepositUpgradeability
 * @dev A contract for testing OrgId upgradeability behaviour
 */
contract LifDepositUpgradeability is LifDeposit {
    uint256 public test;

    function newFunction() external view returns (uint256) {
        return test;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return (
            interfaceId == this.newFunction.selector || 
            super.supportsInterface(interfaceId)
        );
    }

    function setupNewStorage(uint256 value) external onlyOwner {
        test = value;
    }
}
