"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, Mail, Home, Zap, Coins, LogOut, Pencil, Phone, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { safeParseUser } from "@/lib/utils"

interface UserData {
  username: string
  full_name: string
  flat_number: string
  email: string
  phone_number: string
  energy_balance: number
  credits: number
}

function AnimatedCircle({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const radius = 55
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  )
}

export function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editFullName, setEditFullName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")

useEffect(() => {
  const stored = localStorage.getItem("energyflow_user")
  const user = safeParseUser(stored)
  
  if (!user) return

  setUser(user)
  setEditFullName(user.full_name || "")
  setEditUsername(user.username || "")
  setEditEmail(user.email || "")
  setEditPhone(user.phone_number || "")
}, [])


  function handleLogout() {
    localStorage.removeItem("energyflow_user")
    toast.success("Logged out successfully")
    router.push("/")
  }

  function handleEditProfile() {
    if (!user) return
    if (!editFullName.trim()) {
      toast.error("Full name is required")
      return
    }
    if (!editUsername.trim()) {
      toast.error("Username is required")
      return
    }
    const updated = {
      ...user,
      full_name: editFullName.trim(),
      username: editUsername.trim(),
      email: editEmail.trim(),
      phone_number: editPhone.trim(),
    }
    setUser(updated)
    localStorage.setItem("energyflow_user", JSON.stringify(updated))
    setEditOpen(false)
    toast.success("Profile updated successfully")
  }

  if (!user) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <User className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">No user data found</p>
          <p className="text-sm text-muted-foreground/70">Please log in to view your profile</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 glow-green">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{user.full_name || user.username}</CardTitle>
              <CardDescription>EnergyFlow Network Member</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-all duration-200 hover:bg-muted/70">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium">{user.full_name || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-all duration-200 hover:bg-muted/70">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-all duration-200 hover:bg-muted/70">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-all duration-200 hover:bg-muted/70">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-medium">{user.phone_number || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-all duration-200 hover:bg-muted/70">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Block & Flat Number</p>
                <p className="font-medium">{user.flat_number}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Energy Balance & Credits */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Energy & Credits</CardTitle>
          <CardDescription>Your current energy balance and credit overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-12 py-4">
            <AnimatedCircle
              value={user.energy_balance}
              max={100}
              label="kWh"
              color="hsl(145, 100%, 45%)"
            />
            <AnimatedCircle
              value={user.credits}
              max={2000}
              label="Credits"
              color="hsl(213, 68%, 46%)"
            />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-4">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Energy Balance</p>
                <p className="text-lg font-bold">{user.energy_balance} kWh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-accent/5 p-4">
              <Coins className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="text-lg font-bold">{user.credits}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => setEditOpen(true)}
          className="gap-2 transition-all duration-200 hover:scale-[1.03]"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.03]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-border/50 bg-card backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be redirected to the login page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-border/50 bg-card backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your account information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Your full name"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUsername">Username</Label>
              <Input
                id="editUsername"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit phone number"
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditProfile}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
