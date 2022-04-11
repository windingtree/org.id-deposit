// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import "../LifDeposit.sol";

/**
 * @dev Time machine features for the OrgId
 */
contract LifDepositTimeMachine is LifDeposit {
    uint256 internal _currentTime;

    /**
     * @dev This event will be emitted when contraact time changing
     * @param oldTime Time before the rewind
     * @param newTime New contract time
     */
    event TimeMachine(
        uint256 oldTime,
        uint256 newTime
    );

    /**
     * @dev Get current contract time
     * @return contractTime Current time inside the contract used as 'now'
     */
    function currentTime() public view returns (uint256 contractTime) {
        contractTime = time();
    }

    /**
     * @dev Set new contract time
     * @param _time New time value
     */
    function setCurrentTime(uint256 _time) external {
        emit TimeMachine(currentTime(), _time);
        _currentTime = _time;
    }

    /**
     * @dev Get current time
     * This function can be overriden for testing purposes
     * @return uint256 Current block time
     */
    function time() internal view returns (uint256) {
        return _currentTime == 0 ? block.timestamp : _currentTime;// solhint-disable-line not-rely-on-time
    }
}
