import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EnergyMarketplaceModule", (m) => {
  const energyMarketplace = m.contract("EnergyMarketplace");
  return { energyMarketplace };
});
