"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { AlertTriangle, Activity, Zap, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AnomalyAlert } from "@/components/dashboard/anomaly-alert"
import { generateEnergyData, type AnomalyPoint } from "@/lib/store"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  ReferenceDot,
} from "recharts"

interface AnomalyResponse {
  status: "ANOMALY" | "NORMAL"
  anomaly_score: number
  node_id: string
  voltage: number
  current: number
  load: number
  battery_level: number
  timestamp: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: AnomalyPoint }>; label?: string }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">
        Usage: <span className="font-semibold text-foreground">{point.usage.toFixed(2)} kWh</span>
      </p>
      {point.isAnomaly && (
        <p className="text-sm font-medium text-destructive">Anomaly Detected</p>
      )}
    </div>
  )
}

export function AnomalyDetection() {
  const [data, setData] = useState<AnomalyPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResponse | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const anomalyCount = data.filter((d) => d.isAnomaly).length
  const wastedEnergy = data
    .filter((d) => d.isAnomaly)
    .reduce((acc, d) => acc + d.usage, 0)
  const confidence = hasRun ? 94.7 : 0

  /**
   * Send energy data to backend for anomaly detection
   * @param nodeId - Unique node identifier
   * @param voltage - Grid voltage in Volts
   * @param current - Grid current in Amperes
   * @param load - Grid load percentage
   * @param batteryLevel - Battery level percentage
   */
  const detectAnomalyFromBackend = useCallback(
    async (
      nodeId: string,
      voltage: number,
      current: number,
      load: number,
      batteryLevel: number
    ) => {
      try {
        setIsDetecting(true)
        
        // Prepare request payload
        const payload = {
          node_id: nodeId,
          voltage,
          current,
          load,
          battery_level: batteryLevel,
        }

        console.log("Sending anomaly detection request:", payload)

        // Send POST request to backend
        const response = await fetch("http://localhost:8000/detect-anomaly", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        // Handle response
        if (!response.ok) {
          throw new Error(`Backend error: ${response.statusText}`)
        }

        const result: AnomalyResponse = await response.json()
        setAnomalyResult(result)

        // Show appropriate toast based on status
        if (result.status === "ANOMALY") {
          toast.error(
            `⚠️ ANOMALY DETECTED! Score: ${(result.anomaly_score * 100).toFixed(1)}%`
          )
          console.warn("Anomaly detected:", result)
        } else {
          toast.success(
            `✓ Normal Status - Score: ${(result.anomaly_score * 100).toFixed(1)}%`
          )
          console.log("Normal status:", result)
        }

        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        toast.error(`Detection failed: ${errorMessage}`)
        console.error("Anomaly detection error:", error)
        return null
      } finally {
        setIsDetecting(false)
      }
    },
    []
  )

  const runDetection = useCallback(() => {
    setLoading(true)
    // Simulate local detection
    setTimeout(async () => {
      setData(generateEnergyData())
      setHasRun(true)
      
      // Also call backend with sample energy data
      const sampleVoltage = 230 + Math.random() * 20 - 10
      const sampleCurrent = 50 + Math.random() * 50
      const sampleLoad = 45 + Math.random() * 30
      const sampleBattery = 85 - Math.random() * 20
      
      await detectAnomalyFromBackend(
        "NODE-001",
        sampleVoltage,
        sampleCurrent,
        sampleLoad,
        sampleBattery
      )
      
      setLoading(false)
      toast.success("Anomaly detection complete")
    }, 1500)
  }, [detectAnomalyFromBackend])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file")
      return
    }
    setUploading(true)
    setUploadProgress(0)
    // Simulated upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          toast.success(`File "${file.name}" uploaded successfully`)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">Anomaly Detection</CardTitle>
                <CardDescription>Detect unusual energy consumption patterns</CardDescription>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Upload CSV file"
                />
                <Button variant="outline" className="pointer-events-none gap-2">
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
              </div>
              <Button
                onClick={runDetection}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.03]"
              >
                {loading ? "Running..." : "Run Detection"}
              </Button>
            </div>
          </div>
          {uploading && (
            <div className="space-y-2 pt-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Anomaly Detection Result Card */}
      {anomalyResult && (
        <AnomalyAlert
          status={anomalyResult.status}
          anomaly_score={anomalyResult.anomaly_score}
          message={`Node ${anomalyResult.node_id} • V: ${anomalyResult.voltage.toFixed(1)}V • I: ${anomalyResult.current.toFixed(1)}A • L: ${anomalyResult.load.toFixed(1)}%`}
          className="animate-fade-in"
        />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Detected Anomalies</p>
              <p className="text-2xl font-bold">{anomalyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Energy Wasted (kWh)</p>
              <p className="text-2xl font-bold">{wastedEnergy.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence (%)</p>
              <p className="text-2xl font-bold">{confidence}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {hasRun && data.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Energy Usage Over Time</CardTitle>
            <CardDescription>Red dots indicate anomalous consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="hsl(145, 100%, 45%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  {data
                    .filter((d) => d.isAnomaly)
                    .map((d) => (
                      <ReferenceDot
                        key={d.time}
                        x={d.time}
                        y={d.usage}
                        r={6}
                        fill="hsl(0, 84%, 60%)"
                        stroke="hsl(0, 84%, 60%)"
                        strokeWidth={2}
                      />
                    ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasRun && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No detection data yet</p>
            <p className="text-sm text-muted-foreground/70">Click &ldquo;Run Detection&rdquo; to analyze energy patterns</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
