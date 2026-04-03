// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DailyCheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    DailyCheckIn internal c;
    address internal alice = address(0xA11CE);

    function setUp() public {
        c = new DailyCheckIn();
        vm.deal(alice, 10 ether);
    }

    function test_checkIn_no_value() public {
        vm.prank(alice);
        c.checkIn();
        uint256 day = block.timestamp / 1 days;
        assertEq(block.timestamp / 1 days, day);
        assertEq(c.streak(alice), 1);
        assertGt(c.lastCheckInTimestamp(alice), 0);
    }

    function test_revert_if_value_sent() public {
        vm.prank(alice);
        vm.expectRevert(DailyCheckIn.ValueNotZero.selector);
        c.checkIn{value: 1 wei}();
    }

    function test_double_same_day_reverts() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(DailyCheckIn.AlreadyCheckedInToday.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_streak_increments_next_day() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 1 days);
        c.checkIn();
        assertEq(c.streak(alice), 2);
        vm.stopPrank();
    }

    function test_streak_resets_after_gap() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 2 days);
        c.checkIn();
        assertEq(c.streak(alice), 1);
        vm.stopPrank();
    }
}
