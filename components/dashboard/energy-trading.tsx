"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { Search, ShoppingCart, Tag, RefreshCw, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { connectMetaMask, shortAddress } from "@/lib/web3"
import { convertEthToInr, convertInrToWei, formatWeiToEth } from "@/lib/currency"
import { buyOfferOnChain, createOfferOnChain, fetchActiveOffers } from "@/lib/energy-market"

const FALLBACK_ETH_INR = "250000.000000"

interface TradeOffer {
  id: string
  seller: string
  sellerWallet?: string
  units: number
  price_per_unit: number
  total: number
  created_at: string
  pricePerKwhWei: bigint
  draft?: boolean
  deleted?: boolean
}

export function EnergyTrading() {
  const [units, setUnits] = useState("")
  const [price, setPrice] = useState("")
  const [offers, setOffers] = useState<TradeOffer[]>([])
  const [search, setSearch] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("")
  const [buyingOfferId, setBuyingOfferId] = useState<string | null>(null)
  const [publishingOfferId, setPublishingOfferId] = useState<string | null>(null)

  const [ethAmount, setEthAmount] = useState("1")
  const [ethInrRate, setEthInrRate] = useState(FALLBACK_ETH_INR)
  const [loadingRate, setLoadingRate] = useState(false)

  useEffect(() => {
    const rawUser = localStorage.getItem("energyflow_user")
    if (!rawUser) return
    try {
      const user = JSON.parse(rawUser) as { wallet_address?: string }
      if (user.wallet_address) setWalletAddress(user.wallet_address)
    } catch {
      // Ignore invalid local profile.
    }
  }, [])

  async function refreshEthRate() {
    setLoadingRate(true)
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr",
        { cache: "no-store" }
      )
      if (!response.ok) throw new Error("Rate API failed")
      const data = (await response.json()) as { ethereum?: { inr?: number } }
      const nextRate = data?.ethereum?.inr
      if (!nextRate || nextRate <= 0) throw new Error("Invalid ETH-INR rate")
      setEthInrRate(nextRate.toFixed(6))
    } catch {
      setEthInrRate(FALLBACK_ETH_INR)
      toast.error("Using fallback ETH-INR rate")
    } finally {
      setLoadingRate(false)
    }
  }

  async function loadOffersFromChain() {
    setLoadingOffers(true)
    try {
      const chainOffers = await fetchActiveOffers()
      const mapped: TradeOffer[] = chainOffers.map((offer) => {
        const ethPerKwh = formatWeiToEth(offer.pricePerKwhWei, 12)
        const inrPerKwh = convertEthToInr(ethPerKwh, ethInrRate) ?? "0"
        const priceInr = Number(inrPerKwh)
        return {
          id: offer.id,
          seller: shortAddress(offer.seller),
          sellerWallet: offer.seller,
          units: Number(offer.units.toFixed(3)),
          price_per_unit: Number(priceInr.toFixed(2)),
          total: Number((offer.units * priceInr).toFixed(2)),
          created_at: new Date().toISOString(),
          pricePerKwhWei: offer.pricePerKwhWei,
        }
      })
      setOffers((prev) => {
        const drafts = prev.filter((offer) => offer.draft)
        return [...drafts, ...mapped]
      })
      setLastSyncedAt(new Date().toLocaleTimeString())
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch on-chain offers"
      toast.error(message)
    } finally {
      setLoadingOffers(false)
    }
  }

  useEffect(() => {
    refreshEthRate()
  }, [])

  useEffect(() => {
    if (!walletAddress) return
    loadOffersFromChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, ethInrRate])

  useEffect(() => {
    if (!walletAddress) return
    const interval = setInterval(() => {
      loadOffersFromChain()
    }, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, ethInrRate])

  const filteredOffers = useMemo(() => {
    const activeOffers = offers.filter((offer) => !offer.deleted)
    if (!search) return activeOffers
    return activeOffers.filter(
      (o) =>
        o.seller.toLowerCase().includes(search.toLowerCase()) ||
        o.units.toString().includes(search) ||
        o.price_per_unit.toString().includes(search)
    )
  }, [offers, search])

  const myOffers = useMemo(() => {
    if (!walletAddress) return []
    return offers.filter(
      (offer) => offer.sellerWallet?.toLowerCase() === walletAddress.toLowerCase()
    )
  }, [offers, walletAddress])

  const inrValue = convertEthToInr(ethAmount, ethInrRate) ?? "0"

  async function handleConnectWallet() {
    try {
      const { address } = await connectMetaMask()
      setWalletAddress(address)
      const rawUser = localStorage.getItem("energyflow_user")
      if (rawUser) {
        try {
          const user = JSON.parse(rawUser) as Record<string, unknown>
          localStorage.setItem("energyflow_user", JSON.stringify({ ...user, wallet_address: address }))
        } catch {
          // Ignore invalid profile JSON.
        }
      }
      toast.success(`Connected ${shortAddress(address)}`)
      await loadOffersFromChain()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed")
    }
  }

  async function handleListForSale() {
    if (!walletAddress) {
      toast.error("Connect MetaMask before listing")
      return
    }
    if (!units || !price) {
      toast.error("Please fill in both fields")
      return
    }

    const u = parseFloat(units)
    const p = parseFloat(price)
    if (isNaN(u) || isNaN(p) || u <= 0 || p <= 0) {
      toast.error("Please enter valid positive numbers")
      return
    }

    const pricePerKwhWei = convertInrToWei(p.toFixed(2), ethInrRate)
    if (!pricePerKwhWei || pricePerKwhWei <= BigInt(0)) {
      toast.error("Failed to convert INR to on-chain ETH price")
      return
    }

    const draftId = `draft-${Date.now()}`
    const draftOffer: TradeOffer = {
      id: draftId,
      seller: `${shortAddress(walletAddress)} (you)`,
      sellerWallet: walletAddress,
      units: u,
      price_per_unit: Number(p.toFixed(2)),
      total: Number((u * p).toFixed(2)),
      created_at: new Date().toISOString(),
      pricePerKwhWei,
      draft: true,
    }
    setOffers((prev) => [draftOffer, ...prev])
    setUnits("")
    setPrice("")
    toast.success("Listing added. Click Pay & Publish to send on-chain.")
  }

  function handleDeleteDraft(offerId: string) {
    setOffers((prev) =>
      prev.map((offer) => (offer.id === offerId ? { ...offer, deleted: true, draft: false } : offer))
    )
    toast.success("Listing deleted and moved to history")
  }

  async function handlePublishDraft(offer: TradeOffer) {
    if (!offer.draft) return
    try {
      setPublishingOfferId(offer.id)
      await createOfferOnChain(offer.units, offer.pricePerKwhWei)
      setOffers((prev) => prev.filter((current) => current.id !== offer.id))
      toast.success("Listing published on-chain")
      await loadOffersFromChain()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed")
    } finally {
      setPublishingOfferId(null)
    }
  }

  async function handleQuickBuy(offer: TradeOffer) {
    if (!walletAddress) {
      toast.error("Connect MetaMask before buying")
      return
    }

    const totalInr = Number((offer.units * offer.price_per_unit).toFixed(2))
    const paymentWei = convertInrToWei(totalInr.toFixed(2), ethInrRate)
    if (!paymentWei || paymentWei <= BigInt(0)) {
      toast.error("Invalid payment conversion")
      return
    }

    try {
      setBuyingOfferId(offer.id)
      await buyOfferOnChain(offer.id, offer.units, paymentWei)
      toast.success(`Purchased ${offer.units} kWh from listing #${offer.id}`)
      await loadOffersFromChain()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "On-chain buy failed")
    } finally {
      setBuyingOfferId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ethereum to INR Converter</CardTitle>
          <CardDescription>Live conversion + smart contract trading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm">
              Wallet: <span className="font-medium">{walletAddress ? shortAddress(walletAddress) : "Not connected"}</span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadOffersFromChain} disabled={!walletAddress || loadingOffers}>
                <Link2 className="mr-2 h-4 w-4" />
                Sync Chain
              </Button>
              <Button size="sm" variant="outline" onClick={handleConnectWallet}>
                {walletAddress ? "Reconnect Wallet" : "Connect Wallet"}
              </Button>
            </div>
          </div>
          {lastSyncedAt && (
            <p className="text-xs text-muted-foreground">Last synced: {lastSyncedAt}</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ethAmount">ETH</Label>
              <Input
                id="ethAmount"
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="e.g. 0.5"
              />
            </div>
            <Button variant="outline" onClick={refreshEthRate} disabled={loadingRate} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loadingRate ? "animate-spin" : ""}`} />
              Refresh Rate
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              1 ETH = Rs.{Number(ethInrRate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            <p className="text-lg font-semibold">
              {ethAmount || "0"} ETH = Rs.{Number(inrValue).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">My Listings</CardTitle>
          <CardDescription>Offers posted by your connected wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {myOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings from your wallet yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myOffers.map((offer) => (
                <div key={offer.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Offer #{offer.id}</p>
                  <p className="mt-1 text-lg font-semibold">{offer.units} kWh</p>
                  <p className="text-sm text-muted-foreground">Rs.{offer.price_per_unit.toFixed(2)} / kWh</p>
                  <p className="mt-2 text-sm font-medium">Total Rs.{offer.total.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: {offer.deleted ? "Deleted" : offer.draft ? "Draft" : "On-Chain"}
                  </p>
                  {offer.draft && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePublishDraft(offer)}
                        disabled={publishingOfferId === offer.id}
                      >
                        {publishingOfferId === offer.id ? "Publishing..." : "Pay & Publish"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteDraft(offer.id)}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Sell Energy (Smart Contract)</CardTitle>
              <CardDescription>Lists directly on `EnergyMarketplace` contract</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="sellUnits">Energy Units (kWh)</Label>
              <Input
                id="sellUnits"
                type="number"
                placeholder="e.g. 5.0"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="sellPrice">{"Price per Unit (Rs.)"}</Label>
              <Input
                id="sellPrice"
                type="number"
                placeholder="e.g. 6.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <Button
              onClick={handleListForSale}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.03]"
            >
              List On-Chain
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <ShoppingCart className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">On-Chain Offers</CardTitle>
                <CardDescription>{filteredOffers.length} active offers</CardDescription>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background/50 pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Units (kWh)</TableHead>
                  <TableHead className="text-right">{"Price (Rs./unit)"}</TableHead>
                  <TableHead className="text-right">{"Total (Rs.)"}</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.map((offer) => (
                  <TableRow key={offer.id} className="transition-colors duration-200 hover:bg-primary/5">
                    <TableCell className="font-medium">{offer.seller}</TableCell>
                    <TableCell className="text-right">{offer.units}</TableCell>
                    <TableCell className="text-right">{offer.price_per_unit.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">{offer.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {offer.draft ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePublishDraft(offer)}
                            disabled={publishingOfferId === offer.id}
                          >
                            {publishingOfferId === offer.id ? "Publishing..." : "Pay & Publish"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteDraft(offer.id)}>
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickBuy(offer)}
                          disabled={buyingOfferId === offer.id || offer.sellerWallet?.toLowerCase() === walletAddress.toLowerCase()}
                          className="border-primary/30 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-[1.03]"
                        >
                          {buyingOfferId === offer.id ? "Paying..." : "Pay Now"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOffers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {walletAddress ? "No on-chain offers found." : "Connect wallet and sync chain to load offers."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
