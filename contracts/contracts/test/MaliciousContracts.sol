// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/INFTMarketplace.sol";

/**
 * @title MaliciousBuyer
 * @dev Contract to test reentrancy protection during buyNow calls
 */
contract MaliciousBuyer {
    INFTMarketplace public target;
    string public targetListingId;
    uint256 public attackCount;
    uint256 public maxAttacks = 3;

    receive() external payable {
        // Attempt reentrancy when receiving ETH
        if (attackCount < maxAttacks) {
            attackCount++;
            target.buyNow(targetListingId, {value: msg.value});
        }
    }

    function setTarget(address _target, string memory _listingId) external {
        target = INFTMarketplace(_target);
        targetListingId = _listingId;
    }

    function attack() external {
        require(address(this).balance > 0, "Need funds to attack");
        attackCount = 0;
        target.buyNow(targetListingId, {value: address(this).balance});
    }
}

/**
 * @title MaliciousAuctionBidder
 * @dev Contract to test reentrancy protection during auction bids
 */
contract MaliciousAuctionBidder {
    INFTMarketplace public target;
    string public targetAuctionId;
    uint256 public attackCount;
    uint256 public maxAttacks = 3;

    receive() external payable {
        // Attempt reentrancy when receiving refund
        if (attackCount < maxAttacks && msg.value > 0) {
            attackCount++;
            target.placeBid(targetAuctionId, {value: msg.value});
        }
    }

    function setTarget(address _target, string memory _auctionId) external {
        target = INFTMarketplace(_target);
        targetAuctionId = _auctionId;
    }

    function attack() external {
        require(address(this).balance > 0, "Need funds to attack");
        attackCount = 0;
        target.placeBid(targetAuctionId, {value: address(this).balance});
    }
}

/**
 * @title MaliciousWithdrawer
 * @dev Contract to test reentrancy protection during proceeds withdrawal
 */
contract MaliciousWithdrawer {
    INFTMarketplace public target;
    uint256 public attackCount;
    uint256 public maxAttacks = 3;

    receive() external payable {
        // Attempt reentrancy when receiving proceeds
        if (attackCount < maxAttacks) {
            attackCount++;
            target.withdrawProceeds();
        }
    }

    function setTarget(address _target) external {
        target = INFTMarketplace(_target);
    }

    function attack() external {
        attackCount = 0;
        target.withdrawProceeds();
    }
}