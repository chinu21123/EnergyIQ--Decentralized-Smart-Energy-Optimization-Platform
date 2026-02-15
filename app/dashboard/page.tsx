"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Zap,
  ArrowUpDown,
  AlertTriangle,
  Atom,
  RefreshCw,
  User,
  Menu,
  X,
  ArrowUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { EnergyTrading } from "@/components/dashboard/energy-trading"
import { AnomalyDetection } from "@/components/dashboard/anomaly-detection"
import { QuantumOptimization } from "@/components/dashboard/quantum-optimization"
import { SelfHealing } from "@/components/dashboard/self-healing"
import { Profile } from "@/components/dashboard/profile"
import { safeParseUser } from "@/lib/utils"

const tabs = [
  {
    id: "trading",
    label: "Trading",
    icon: ArrowUpDown,
    description: "Buy and sell energy units on the network",
  },
  {
    id: "anomaly",
    label: "Anomaly",
    icon: AlertTriangle,
    description: "Detect unusual energy consumption patterns",
  },
  {
    id: "optimization",
    label: "Optimization",
    icon: Atom,
    description: "Quantum-inspired energy redistribution",
  },
  {
    id: "self-healing",
    label: "Self-Healing",
    icon: RefreshCw,
    description: "Monitor node trust and federated network health",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "View and manage your account",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("trading")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem("energyflow_user")
    const userData = safeParseUser(stored)
    setUser(userData)
  }, [])

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-border transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center gap-3 h-16">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            <Zap className="h-6 w-6" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg">EnergyFlow</span>}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-sidebar-accent"
                }`}
                title={tab.label}
              >
                <TabIcon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{tab.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          <ThemeToggle />
          <Button
            onClick={() => {
              localStorage.removeItem("user")
              router.push("/")
            }}
            className="w-full text-xs"
            variant="outline"
          >
            {sidebarOpen ? "Sign Out" : "Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {tabs.find((t) => t.id === activeTab)?.description}
                </p>
              </div>
            </div>

            {/* User Profile & Stats */}
            <div className="flex items-center gap-6">
              {/* Quick Stats */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">2.45 kWh</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Available energy units</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* User Menu */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="hidden sm:flex flex-col">
                        <span className="text-sm font-medium">{user?.name || "User"}</span>
                        <span className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Your profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="mx-auto max-w-5xl animate-fade-in" key={activeTab}>
            {activeTab === "trading" && <EnergyTrading />}
            {activeTab === "anomaly" && <AnomalyDetection />}
            {activeTab === "optimization" && <QuantumOptimization />}
            {activeTab === "self-healing" && <SelfHealing />}
            {activeTab === "profile" && <Profile />}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background/80 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm text-muted-foreground">
              Detect. Optimize. Conserve. — Powering a Smarter, Greener Future.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              EnergyFlow © 2024 | Decentralized Smart Grid Platform
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
