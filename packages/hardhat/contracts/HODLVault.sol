// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title HODLVault
 * @dev A minimalist dApp that allows users to lock their ETH for 24 hours.
 */
contract HODLVault {
	mapping(address => uint256) public balances;
	mapping(address => uint256) public lockTimestamps;

	event FundsLocked(address indexed user, uint256 amount, uint256 unlockTime);
	event FundsWithdrawn(address indexed user, uint256 amount);

	/**
	 * @dev Deposit ETH and lock it for 24 hours.
	 */
	function lockFunds() public payable {
		require(msg.value > 0, "Must lock some ETH");
		
		balances[msg.sender] += msg.value;
		lockTimestamps[msg.sender] = block.timestamp + 24 hours;

		emit FundsLocked(msg.sender, msg.value, lockTimestamps[msg.sender]);
	}

	/**
	 * @dev Withdraw ETH after the lock period has passed.
	 */
	function withdraw() public {
		uint256 amount = balances[msg.sender];
		require(amount > 0, "No funds to withdraw");
		require(block.timestamp >= lockTimestamps[msg.sender], "Funds are still locked");

		balances[msg.sender] = 0;
		lockTimestamps[msg.sender] = 0;

		(bool success, ) = msg.sender.call{ value: amount }("");
		require(success, "Withdrawal failed");

		emit FundsWithdrawn(msg.sender, amount);
	}

	/**
	 * @dev Helper to check time remaining for a user.
	 */
	function getTimeRemaining(address user) public view returns (uint256) {
		if (block.timestamp >= lockTimestamps[user]) {
			return 0;
		}
		return lockTimestamps[user] - block.timestamp;
	}

	// Function to receive ETH
	receive() external payable {
		lockFunds();
	}
}
