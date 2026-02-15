"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { RefreshCw, Shield, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { generateTrustNodes, type TrustNode } from "@/lib/store"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

interface AggregateApiResponse {
  nodes: TrustNode[]
  stable_count: number
  at_risk_count: number
  network_health: number
}

interface SelfHealResponse {
  status: "STABLE" | "FAULT_DETECTED"
  action_taken: string
  grid_status: string
  updated_load: number
  updated_battery: number
  risk_score: number
}

interface GridState {
  node_id: string
  voltage: number
  load: number
  battery_level: number
}

const DEMO_START_STATE: GridState = {
  node_id: "NODE-001",
  voltage: 238,
  load: 92,
  battery_level: 28,
}

function TrustScoreRing({ score }: { score: number }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? "hsl(145, 100%, 45%)" : score >= 40 ? "hsl(43, 74%, 66%)" : "hsl(0, 84%, 60%)"

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xs font-semibold">{score.toFixed(0)}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: TrustNode["status"] }) {
  const styles = {
    stable: "bg-primary/10 text-primary",
    warning: "bg-yellow-500/10 text-yellow-500",
    faulty: "bg-destructive/10 text-destructive",
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function SelfHealing() {
  const [nodes, setNodes] = useState<TrustNode[]>(() => generateTrustNodes())
  const [loading, setLoading] = useState(false)
  const [healLoading, setHealLoading] = useState(false)
  const [healResult, setHealResult] = useState<SelfHealResponse | null>(null)
  const [gridState, setGridState] = useState<GridState>(DEMO_START_STATE)

  const { stableCount, atRiskCount, networkHealth } = useMemo(() => {
    const stable = nodes.filter((n) => n.status === "stable").length
    const atRisk = nodes.length - stable
    const health = nodes.length ? (stable / nodes.length) * 100 : 0
    return { stableCount: stable, atRiskCount: atRisk, networkHealth: health }
  }, [nodes])

  const healthLabel = networkHealth >= 70 ? "Stable" : networkHealth >= 40 ? "Warning" : "Critical"
  const healthColor = networkHealth >= 70 ? "text-primary" : networkHealth >= 40 ? "text-yellow-500" : "text-destructive"

  async function runAggregation() {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/aggregate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_count: 8 }),
      })
      if (!response.ok) {
        throw new Error(`Aggregation failed: ${response.status}`)
      }
      const data = (await response.json()) as AggregateApiResponse
      setNodes(data.nodes)
      toast.success("Federated aggregation complete, trust scores updated")
    } catch {
      setNodes(generateTrustNodes())
      toast.error("Backend unavailable, using local simulated trust data")
    } finally {
      setLoading(false)
    }
  }

  async function runSelfHealing() {
    setHealLoading(true)
    try {
      const response = await fetch(`${API_BASE}/self-heal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gridState),
      })
      if (!response.ok) {
        throw new Error(`Self-healing failed: ${response.status}`)
      }
      const data = (await response.json()) as SelfHealResponse
      setHealResult(data)
      setGridState((prev) => ({
        ...prev,
        load: data.updated_load,
        battery_level: data.updated_battery,
      }))
      if (data.status === "STABLE") {
        toast.success("Grid stable, no intervention required")
      } else {
        toast.warning(`Fault handled: ${data.action_taken}`)
      }
    } catch {
      toast.error("Self-healing backend call failed")
    } finally {
      setHealLoading(false)
    }
  }

  function resetDemoScenario() {
    setGridState(DEMO_START_STATE)
    setHealResult(null)
    toast.success("Demo scenario reset")
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Self-Healing Network</CardTitle>
                <CardDescription>Monitor and manage federated node trust scores</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={resetDemoScenario}
                variant="outline"
                className="transition-all duration-300 hover:scale-[1.03]"
              >
                Reset Demo
              </Button>
              <Button
                onClick={runSelfHealing}
                disabled={healLoading}
                variant="outline"
                className="transition-all duration-300 hover:scale-[1.03]"
              >
                {healLoading ? "Healing..." : "Run Self-Heal"}
              </Button>
              <Button
                onClick={runAggregation}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.03]"
              >
                {loading ? "Running..." : "Run Aggregation"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Demo Node Input</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Node</p>
              <p className="font-semibold">{gridState.node_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Voltage (V)</p>
              <p className="font-semibold">{gridState.voltage.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Load (%)</p>
              <p className="font-semibold">{gridState.load.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Battery (%)</p>
              <p className="font-semibold">{gridState.battery_level.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {healResult && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold">{healResult.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grid</p>
                <p className="font-semibold">{healResult.grid_status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="font-semibold">{healResult.risk_score}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{healResult.action_taken}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:justify-around">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <svg width="120" height="120" className="-rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={networkHealth >= 70 ? "hsl(145, 100%, 45%)" : networkHealth >= 40 ? "hsl(43, 74%, 66%)" : "hsl(0, 84%, 60%)"}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 - (networkHealth / 100) * 2 * Math.PI * 48}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${healthColor}`}>{networkHealth.toFixed(0)}%</span>
              </div>
            </div>
            <span className={`text-sm font-medium ${healthColor}`}>Network {healthLabel}</span>
          </div>

          <div className="flex gap-10">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">{stableCount}</span>
              <span className="text-xs text-muted-foreground">Stable</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Wifi className="h-6 w-6 text-destructive" />
              </div>
              <span className="text-2xl font-bold">{atRiskCount}</span>
              <span className="text-xs text-muted-foreground">At Risk</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Node Trust Scores</CardTitle>
          <CardDescription>Real-time federated node status and trust levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Node ID</TableHead>
                  <TableHead className="text-center">Trust Score</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => (
                  <TableRow key={node.node_id} className="transition-colors duration-200 hover:bg-primary/5">
                    <TableCell className="font-mono text-sm font-medium">{node.node_id}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <TrustScoreRing score={node.trust_score} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={node.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(node.last_update).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
