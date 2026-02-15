const TEN = BigInt(10)
const WEI_PER_ETH = BigInt("1000000000000000000")
const RATE_SCALE = 6
const INR_SCALE = 2

function pow10(exp: number): bigint {
  let result = BigInt(1)
  for (let i = 0; i < exp; i += 1) {
    result *= TEN
  }
  return result
}

function decimalToScaledInt(value: string, scale: number): bigint | null {
  const clean = value.trim().replace(/,/g, "")
  if (!/^\d+(\.\d+)?$/.test(clean)) return null

  const [whole, fraction = ""] = clean.split(".")
  const padded = (fraction + "0".repeat(scale)).slice(0, scale)
  const wholeInt = BigInt(whole || "0")
  const fracInt = BigInt(padded || "0")

  return wholeInt * pow10(scale) + fracInt
}

function scaledIntToDecimal(value: bigint, scale: number, maxFraction: number): string {
  const base = pow10(scale)
  const whole = value / base
  const fraction = (value % base).toString().padStart(scale, "0")
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, "")
  return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString()
}

export function convertEthToInr(ethAmount: string, inrPerEthRate: string): string | null {
  const ethWei = decimalToScaledInt(ethAmount, 18)
  const rateScaled = decimalToScaledInt(inrPerEthRate, RATE_SCALE)
  if (!ethWei || !rateScaled || rateScaled <= BigInt(0)) return null

  const inrScaled =
    (ethWei * rateScaled * pow10(INR_SCALE)) / (WEI_PER_ETH * pow10(RATE_SCALE))
  return scaledIntToDecimal(inrScaled, INR_SCALE, 2)
}

export function convertInrToWei(inrAmount: string, inrPerEthRate: string): bigint | null {
  const inrScaled = decimalToScaledInt(inrAmount, INR_SCALE)
  const rateScaled = decimalToScaledInt(inrPerEthRate, RATE_SCALE)
  if (!inrScaled || !rateScaled || rateScaled <= BigInt(0)) return null

  return (inrScaled * WEI_PER_ETH * pow10(RATE_SCALE)) / (pow10(INR_SCALE) * rateScaled)
}

export function formatWeiToEth(wei: bigint, maxFraction = 6): string {
  if (wei <= BigInt(0)) return "0"
  return scaledIntToDecimal(wei, 18, maxFraction)
}
