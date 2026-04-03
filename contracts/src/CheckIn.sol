// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Daily on-chain check-in on Base. No fee — users pay L2 gas only.
contract DailyCheckIn {
    error ValueNotZero();
    error AlreadyCheckedInToday();

    /// @dev Timestamp of last check-in; 0 = never.
    mapping(address => uint256) public lastCheckInTimestamp;
    mapping(address => uint256) public streak;

    event CheckedIn(address indexed user, uint256 indexed day, uint256 streakCount);

    function checkIn() external payable {
        if (msg.value != 0) revert ValueNotZero();

        uint256 today = block.timestamp / 1 days;
        uint256 lastTs = lastCheckInTimestamp[msg.sender];

        if (lastTs != 0 && lastTs / 1 days == today) revert AlreadyCheckedInToday();

        uint256 lastDay = lastTs == 0 ? 0 : lastTs / 1 days;
        uint256 newStreak;
        if (lastTs == 0) {
            newStreak = 1;
        } else if (lastDay == today - 1) {
            newStreak = streak[msg.sender] + 1;
        } else {
            newStreak = 1;
        }

        lastCheckInTimestamp[msg.sender] = block.timestamp;
        streak[msg.sender] = newStreak;

        emit CheckedIn(msg.sender, today, newStreak);
    }
}
