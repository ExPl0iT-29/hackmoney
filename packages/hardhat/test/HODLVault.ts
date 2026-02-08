import { expect } from "chai";
import { ethers } from "hardhat";
import { HODLVault } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("HODLVault", function () {
    let hodlVault: HODLVault;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;

    before(async () => {
        [owner, addr1] = await ethers.getSigners();
        const hodlVaultFactory = await ethers.getContractFactory("HODLVault");
        hodlVault = (await hodlVaultFactory.deploy()) as HODLVault;
        await hodlVault.waitForDeployment();
    });

    describe("Locking Funds", function () {
        it("Should lock ETH and set correctly the balance and unlock time", async function () {
            const lockAmount = ethers.parseEther("1");
            await hodlVault.connect(addr1).lockFunds({ value: lockAmount });

            expect(await hodlVault.balances(addr1.address)).to.equal(lockAmount);

            const unlockTime = await hodlVault.lockTimestamps(addr1.address);
            const latestBlock = await ethers.provider.getBlock("latest");
            // Should be roughly 24 hours from now
            expect(unlockTime).to.be.closeTo(BigInt(latestBlock!.timestamp) + BigInt(24 * 60 * 60), 10);
        });

        it("Should fail if no ETH is sent", async function () {
            await expect(hodlVault.connect(addr1).lockFunds({ value: 0 })).to.be.revertedWith("Must lock some ETH");
        });
    });

    describe("Withdrawals", function () {
        it("Should fail if trying to withdraw before 24 hours", async function () {
            await expect(hodlVault.connect(addr1).withdraw()).to.be.revertedWith("Funds are still locked");
        });

        it("Should allow withdrawal after 24 hours", async function () {
            // Advance time by 24 hours
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const initialBalance = await ethers.provider.getBalance(addr1.address);
            const tx = await hodlVault.connect(addr1).withdraw();
            const receipt = await tx.wait();

            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            const finalBalance = await ethers.provider.getBalance(addr1.address);

            expect(finalBalance).to.equal(initialBalance + ethers.parseEther("1") - gasUsed);
            expect(await hodlVault.balances(addr1.address)).to.equal(0n);
        });

        it("Should fail if no funds are locked", async function () {
            await expect(hodlVault.connect(owner).withdraw()).to.be.revertedWith("No funds to withdraw");
        });
    });
});
