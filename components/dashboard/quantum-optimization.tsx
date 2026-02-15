"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Atom, TrendingDown, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateOptimizationData } from "@/lib/store"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value} kWh</span>
        </p>
      ))}
    </div>
  )
}

export function QuantumOptimization() {
  const [data, setData] = useState<Array<{ zone: string; before: number; after: number }>>([])
  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const totalBefore = data.reduce((a, d) => a + d.before, 0)
  const totalAfter = data.reduce((a, d) => a + d.after, 0)
  const energySaved = totalBefore - totalAfter
  const costEfficiency = totalBefore > 0 ? ((energySaved / totalBefore) * 100) : 0

  function runOptimization() {
    setLoading(true)
    // Placeholder: POST /optimize
    setTimeout(() => {
      setData(generateOptimizationData())
      setHasRun(true)
      setLastRun(new Date().toLocaleTimeString())
      setLoading(false)
      toast.success("Quantum optimization complete")
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Atom className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Quantum Optimization</CardTitle>
                <CardDescription>Optimize energy redistribution using quantum-inspired algorithms</CardDescription>
              </div>
            </div>
            <Button
              onClick={runOptimization}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.03]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Optimizing...
                </span>
              ) : (
                "Run Optimization"
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Running Quantum Optimization</p>
            <p className="text-sm text-muted-foreground">Analyzing energy distribution patterns...</p>
          </CardContent>
        </Card>
      )}

      {/* Result Cards */}
      {hasRun && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Atom className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Optimal Redistribution Plan</p>
                  <p className="text-2xl font-bold">{data.length} Zones</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <TrendingDown className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Energy Saved (kWh)</p>
                  <p className="text-2xl font-bold">{energySaved.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Efficiency (%)</p>
                  <p className="text-2xl font-bold">{costEfficiency.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Before vs After Optimization</CardTitle>
                  <CardDescription>Energy consumption comparison by zone</CardDescription>
                </div>
                {lastRun && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last run: {lastRun}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="zone" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="before" name="Before" fill="hsl(213, 68%, 46%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" name="After" fill="hsl(145, 100%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!hasRun && !loading && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Atom className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No optimization data yet</p>
            <p className="text-sm text-muted-foreground/70">Click &ldquo;Run Optimization&rdquo; to start quantum analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
