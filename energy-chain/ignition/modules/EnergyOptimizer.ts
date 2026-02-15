import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EnergyOptimizerModule", (m) => {
  const energyOptimizer = m.contract("EnergyOptimizer");

  return { energyOptimizer };
});
