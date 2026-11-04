// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Script.sol";
import "../src/Duel.sol";

contract DeployScript is Script {
  function run() external returns (Duel duel) {
    uint256 deployerPrivateKey = vm.envOr(
      "DEPLOYER_PRIVATE_KEY",
      uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
    );

    vm.startBroadcast(deployerPrivateKey);
    duel = new Duel();
    vm.stopBroadcast();
  }
}
