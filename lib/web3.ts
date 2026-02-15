export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null
  return window.ethereum ?? null
}

export async function connectMetaMask(): Promise<{ address: string; chainId: string }> {
  const provider = getEthereumProvider()
  if (!provider) throw new Error("MetaMask is not installed")

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[]
  const chainId = (await provider.request({ method: "eth_chainId" })) as string
  const address = accounts?.[0]

  if (!address) throw new Error("No wallet account found")
  return { address, chainId }
}

export function shortAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function weiToHex(wei: bigint): string {
  if (wei <= BigInt(0)) return "0x0"
  return `0x${wei.toString(16)}`
}
