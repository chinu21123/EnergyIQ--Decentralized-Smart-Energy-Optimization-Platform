// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyOptimizer {

    struct EnergyData {
        uint256 energy;
        uint256 cost;
    }

    mapping(address => EnergyData) public userEnergy;

    event OptimizationRequested(address indexed user, uint256 energy, uint256 cost);
    event OptimizationResult(address indexed user, uint256 energySaved);

    function submitEnergy(uint256 energy, uint256 cost) public {
        userEnergy[msg.sender] = EnergyData(energy, cost);
        emit OptimizationRequested(msg.sender, energy, cost);
    }

    function submitOptimizationResult(address user, uint256 energySaved) public {
        emit OptimizationResult(user, energySaved);
    }
}
