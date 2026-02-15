"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AnomalyAlertProps {
  /**
   * Status of the anomaly detection
   * "ANOMALY" - Anomaly detected
   * "NORMAL" - System operating normally
   */
  status: "ANOMALY" | "NORMAL"

  /**
   * Anomaly score from 0 to 1
   * 0 = definitely normal
   * 1 = definitely anomaly
   */
  anomaly_score: number

  /**
   * Optional additional message to display
   */
  message?: string

  /**
   * Optional click handler
   */
  onClick?: () => void

  /**
   * Optional custom className for the card
   */
  className?: string
}

/**
 * AnomalyAlert Component
 *
 * Displays a visual alert card indicating whether an anomaly was detected
 * in the energy grid. Shows different styling and icons based on status.
 *
 * @example
 * ```tsx
 * <AnomalyAlert 
 *   status="NORMAL" 
 *   anomaly_score={0.23}
 *   message="Grid operating within parameters"
 * />
 *
 * <AnomalyAlert 
 *   status="ANOMALY" 
 *   anomaly_score={0.87}
 *   message="High voltage fluctuation detected"
 * />
 * ```
 */
export function AnomalyAlert({
  status,
  anomaly_score,
  message,
  onClick,
  className = "",
}: AnomalyAlertProps) {
  const isAnomaly = status === "ANOMALY"
  const scorePercentage = (anomaly_score * 100).toFixed(1)

  // Dynamic styling based on status
  const cardStyles = isAnomaly
    ? {
        bg: "bg-red-950/40",
        border: "border-red-500/40",
        hoverBg: "hover:bg-red-950/60",
      }
    : {
        bg: "bg-green-950/40",
        border: "border-green-500/40",
        hoverBg: "hover:bg-green-950/60",
      }

  const iconStyles = isAnomaly
    ? "text-red-500"
    : "text-green-500"

  const titleColor = isAnomaly
    ? "text-red-400"
    : "text-green-400"

  const textColor = isAnomaly
    ? "text-red-300"
    : "text-green-300"

  return (
    <Card
      className={`
        border-border/50 backdrop-blur-sm transition-all duration-300
        ${cardStyles.bg} ${cardStyles.border}
        ${onClick ? "cursor-pointer" : ""}
        ${cardStyles.hoverBg}
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left side: Icon and Title */}
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isAnomaly ? "bg-red-500/20" : "bg-green-500/20"} flex-shrink-0`}>
              {isAnomaly ? (
                <AlertTriangle className={`h-6 w-6 ${iconStyles}`} />
              ) : (
                <CheckCircle2 className={`h-6 w-6 ${iconStyles}`} />
              )}
            </div>

            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${titleColor}`}>
                {isAnomaly ? "⚠️ Anomaly Detected" : "✅ System Stable"}
              </h3>
              <p className={`text-sm ${textColor} mt-1`}>
                {message ||
                  (isAnomaly
                    ? "Unusual energy consumption pattern detected"
                    : "Energy grid operating normally")}
              </p>
            </div>
          </div>

          {/* Right side: Score */}
          <div className="flex flex-col items-center gap-1 rounded-lg bg-black/30 p-3 md:items-end">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Anomaly Score
            </p>
            <div className="flex items-baseline gap-1">
              <p className={`text-3xl font-bold ${titleColor}`}>
                {scorePercentage}
              </p>
              <p className={`text-sm ${textColor}`}>%</p>
            </div>

            {/* Score indicator bar */}
            <div className="mt-2 w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAnomaly
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(anomaly_score * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Optional details grid */}
        {isAnomaly && (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-red-500/20 pt-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-red-400">Critical</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Action</span>
              <span className="font-semibold text-red-400">Review Required</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AnomalyAlert
