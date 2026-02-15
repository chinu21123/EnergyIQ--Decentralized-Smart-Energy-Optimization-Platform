"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Wallet, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { safeParseUser } from "@/lib/utils"
import { connectMetaMask, shortAddress } from "@/lib/web3"

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [hasCorruptedData, setHasCorruptedData] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user already authenticated
    const stored = localStorage.getItem("energyflow_user")
    const user = safeParseUser(stored)
    
    if (user) {
      router.replace("/dashboard")
    } else if (stored && !user) {
      // Data exists but is corrupted
      setHasCorruptedData(true)
    }
    setIsChecking(false)
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password")
      return
    }

    setLoading(true)
    
    // Simulate login - in real app, this would call a backend API
    setTimeout(() => {
      // Demo users for testing
      if (username.toLowerCase() === "demo" && password === "Demo@123") {
        const userData = {
          username: "demo",
          full_name: "Demo User",
          email: "demo@example.com",
          phone_number: "1234567890",
          flat_number: "A-101",
          energy_balance: 75,
          credits: 1500,
        }
        localStorage.setItem("energyflow_user", JSON.stringify(userData))
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error("Invalid credentials. Try demo/Demo@123")
      }
      setLoading(false)
    }, 800)
  }

  const handleClearCorruptedData = () => {
    localStorage.removeItem("energyflow_user")
    setHasCorruptedData(false)
  }

  const handleMetaMaskLogin = async () => {
    setWalletLoading(true)
    try {
      const { address, chainId } = await connectMetaMask()
      const userData = {
        username: shortAddress(address),
        full_name: "Wallet User",
        email: "",
        phone_number: "",
        flat_number: "N/A",
        energy_balance: 75,
        credits: 1500,
        wallet_address: address,
        chain_id: chainId,
      }
      localStorage.setItem("energyflow_user", JSON.stringify(userData))
      toast.success("MetaMask login successful")
      router.push("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "MetaMask login failed")
    } finally {
      setWalletLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
        <div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl animate-fade-in">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 glow-green">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            EnergyFlow
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Smart Energy Optimization System
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {hasCorruptedData && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                ⚠️ Corrupted data detected
              </p>
              <Button 
                onClick={handleClearCorruptedData}
                variant="outline"
                className="mt-2 w-full text-xs"
              >
                Clear & Continue
              </Button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-background/50"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Demo credentials: <br />
              Username: <code className="font-mono">demo</code> <br />
              Password: <code className="font-mono">Demo@123</code>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              disabled={loading || walletLoading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/80 px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push("/signup")}
            disabled={loading || walletLoading}
            className="w-full"
          >
            Create New Account
          </Button>

          <Button
            variant="outline"
            onClick={handleMetaMaskLogin}
            disabled={loading || walletLoading}
            className="w-full gap-2"
          >
            <Wallet className="h-4 w-4" />
            {walletLoading ? "Connecting Wallet..." : "Login with MetaMask"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
