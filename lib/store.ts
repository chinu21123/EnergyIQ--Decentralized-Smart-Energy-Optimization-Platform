// Client-side state management for the EnergyFlow demo app
// This acts as a placeholder for real backend integration

export interface User {
  user_id: string
  full_name: string
  username: string
  email: string
  phone_number: string
  flat_number: string
  energy_balance: number
  credits: number
}

export interface Offer {
  id: string
  seller: string
  units: number
  price_per_unit: number
  total: number
  created_at: string
}

export interface TrustNode {
  node_id: string
  trust_score: number
  status: "stable" | "warning" | "faulty"
  last_update: string
}

export interface AnomalyPoint {
  time: string
  usage: number
  isAnomaly: boolean
}

// Demo data generators
export function generateEnergyData(): AnomalyPoint[] {
  const data: AnomalyPoint[] = []
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, "0") + ":00"
    const baseUsage = 2 + Math.sin(i / 3) * 1.5 + Math.random() * 0.5
    const isAnomaly = i === 7 || i === 14 || i === 19
    data.push({
      time: hour,
      usage: isAnomaly ? baseUsage + 3 + Math.random() * 2 : parseFloat(baseUsage.toFixed(2)),
      isAnomaly,
    })
  }
  return data
}

export function generateOffers(): Offer[] {
  const sellers = ["Flat 101", "Flat 204", "Flat 305", "Flat 412", "Flat 503"]
  return sellers.map((seller, i) => ({
    id: `offer-${i + 1}`,
    seller,
    units: parseFloat((Math.random() * 10 + 2).toFixed(1)),
    price_per_unit: parseFloat((Math.random() * 3 + 4).toFixed(2)),
    total: 0,
    created_at: new Date().toISOString(),
  })).map(o => ({ ...o, total: parseFloat((o.units * o.price_per_unit).toFixed(2)) }))
}

export function generateTrustNodes(): TrustNode[] {
  return Array.from({ length: 8 }, (_, i) => {
    const score = Math.random() * 100
    return {
      node_id: `NODE-${(i + 1).toString().padStart(3, "0")}`,
      trust_score: parseFloat(score.toFixed(1)),
      status: score > 70 ? "stable" : score > 40 ? "warning" : "faulty",
      last_update: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }
  })
}

export function generateOptimizationData() {
  const zones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]
  return zones.map(zone => ({
    zone,
    before: parseFloat((Math.random() * 20 + 10).toFixed(1)),
    after: parseFloat((Math.random() * 10 + 5).toFixed(1)),
  }))
}

// API endpoint labels for backend integration
export const API_ENDPOINTS = {
  login: "/login",
  signup: "/signup",
  sell_energy: "/sell_energy",
  buy_offer: "/buy_offer",
  offers: "/offers",
  upload_update: "/upload_update",
  aggregate: "/aggregate",
  optimize: "/optimize",
  trust: "/trust",
  audit: "/audit",
  run_anomaly: "/run_anomaly",
} as const

// PostgreSQL table references
export const DB_TABLES = {
  users: "users",
  offers: "offers",
  transactions: "transactions",
  trust_scores: "trust_scores",
  energy_data: "energy_data",
} as const
