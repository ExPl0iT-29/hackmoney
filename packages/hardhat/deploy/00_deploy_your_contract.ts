import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployHODLVault: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("HODLVault", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("🚀 HODLVault deployed!");
};

export default deployHODLVault;

deployHODLVault.tags = ["HODLVault"];

