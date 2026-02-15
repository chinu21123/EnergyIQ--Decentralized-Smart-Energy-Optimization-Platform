import { BrowserProvider, Contract } from "ethers"
import { getEthereumProvider } from "@/lib/web3"

const MARKET_ADDRESS = process.env.NEXT_PUBLIC_ENERGY_MARKET_ADDRESS ?? ""

export const ENERGY_MARKET_ABI = [
  "function listOffer(uint256 unitsMilliKwh, uint256 pricePerKwhWei) returns (uint256)",
  "function buyOffer(uint256 offerId, uint256 unitsMilliKwh) payable",
  "function getActiveOffers() view returns (tuple(uint256 id,address seller,uint256 unitsMilliKwh,uint256 remainingMilliKwh,uint256 pricePerKwhWei,bool active)[])",
] as const

export interface ChainOffer {
  id: string
  seller: string
  units: number
  pricePerKwhWei: bigint
}

function getMarketAddress(): string {
  if (!MARKET_ADDRESS) {
    throw new Error("Set NEXT_PUBLIC_ENERGY_MARKET_ADDRESS to use smart-contract trading")
  }
  return MARKET_ADDRESS
}

async function getContract(write = false): Promise<Contract> {
  const injected = getEthereumProvider()
  if (!injected) throw new Error("MetaMask provider not available")

  const provider = new BrowserProvider(injected)
  const target = getMarketAddress()
  if (!write) return new Contract(target, ENERGY_MARKET_ABI, provider)

  const signer = await provider.getSigner()
  return new Contract(target, ENERGY_MARKET_ABI, signer)
}

export async function fetchActiveOffers(): Promise<ChainOffer[]> {
  const contract = await getContract(false)
  const onchainOffers = (await contract.getActiveOffers()) as Array<{
    id: bigint
    seller: string
    remainingMilliKwh: bigint
    pricePerKwhWei: bigint
  }>

  return onchainOffers.map((offer) => ({
    id: offer.id.toString(),
    seller: offer.seller,
    units: Number(offer.remainingMilliKwh) / 1000,
    pricePerKwhWei: offer.pricePerKwhWei,
  }))
}

export async function createOfferOnChain(units: number, pricePerKwhWei: bigint): Promise<void> {
  const unitsMilliKwh = BigInt(Math.round(units * 1000))
  if (unitsMilliKwh <= BigInt(0)) throw new Error("Invalid units for listing")
  if (pricePerKwhWei <= BigInt(0)) throw new Error("Invalid on-chain price")

  const contract = await getContract(true)
  const tx = await contract.listOffer(unitsMilliKwh, pricePerKwhWei)
  await tx.wait()
}

export async function buyOfferOnChain(offerId: string, units: number, paymentWei: bigint): Promise<void> {
  const unitsMilliKwh = BigInt(Math.round(units * 1000))
  if (unitsMilliKwh <= BigInt(0)) throw new Error("Invalid buy quantity")
  if (paymentWei <= BigInt(0)) throw new Error("Invalid payment value")

  const contract = await getContract(true)
  const tx = await contract.buyOffer(BigInt(offerId), unitsMilliKwh, { value: paymentWei })
  await tx.wait()
}
