"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Zap, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [flatNumber, setFlatNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validation rules
  const usernameValid = /^[a-zA-Z0-9]{1,20}$/.test(username)
  const usernameError = touched.username && !usernameValid
    ? username.length === 0
      ? "Username is required"
      : username.length > 20
        ? "Max 20 characters"
        : "Alphanumeric only, no spaces"
    : null

  const passwordHasNumeral = /[0-9]/.test(password)
  const passwordHasSpecial = /[!@#$%^&*]/.test(password)
  const passwordLengthOk = password.length >= 1 && password.length <= 10
  const passwordValid = passwordHasNumeral && passwordHasSpecial && passwordLengthOk
  const passwordTouched = touched.password && password.length > 0

  const phoneValid = /^[0-9]{10}$/.test(phone)
  const phoneError = touched.phone && phone.length > 0 && !phoneValid
    ? "Enter a valid 10-digit phone number"
    : null

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const flatValid = /^[A-Z]-\d{1,4}$/.test(flatNumber)
  const flatError = touched.flat && flatNumber.length > 0 && !flatValid
    ? "Use format: Block-FlatNo (e.g. A-502, B-809)"
    : null

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      usernameValid &&
      emailValid &&
      phoneValid &&
      passwordValid &&
      flatValid
    )
  }, [fullName, usernameValid, emailValid, phoneValid, passwordValid, flatValid])

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function handleSignup() {
    if (!canSubmit) {
      toast.error("Please fix the validation errors before submitting")
      return
    }
    setLoading(true)
    // Placeholder: POST /signup -> stores in PostgreSQL users table
    setTimeout(() => {
      // Create user object and save to localStorage
      const userData = {
        username,
        full_name: fullName,
        email,
        phone_number: phone,
        flat_number: flatNumber,
        energy_balance: 50, // Default energy balance
        credits: 1000, // Default credits
      }
      localStorage.setItem("energyflow_user", JSON.stringify(userData))
      
      toast.success("Account created successfully! Welcome to EnergyFlow.")
      router.push("/dashboard")
    }, 1000)
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
          <CardTitle className="text-2xl font-bold tracking-tight text-balance">
            Create Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Join the EnergyFlow network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur("fullName")}
              className="bg-background/50"
            />
            {touched.fullName && fullName.trim().length === 0 && (
              <p className="text-xs text-destructive">Full name is required</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="alphanumeric, max 20 chars"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur("username")}
              className={`bg-background/50 ${usernameError ? "border-destructive" : touched.username && usernameValid ? "border-primary" : ""}`}
              maxLength={21}
            />
            {usernameError && (
              <p className="text-xs text-destructive">{usernameError}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`bg-background/50 ${touched.email && !emailValid && email.length > 0 ? "border-destructive" : ""}`}
            />
            {touched.email && !emailValid && email.length > 0 && (
              <p className="text-xs text-destructive">Enter a valid email address</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              onBlur={() => handleBlur("phone")}
              className={`bg-background/50 ${phoneError ? "border-destructive" : touched.phone && phoneValid ? "border-primary" : ""}`}
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="max 10 chars, 1 number, 1 special (!@#$%^&*)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              className={`bg-background/50 ${touched.password && !passwordValid && password.length > 0 ? "border-destructive" : touched.password && passwordValid ? "border-primary" : ""}`}
              maxLength={10}
            />
            {passwordTouched && (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center gap-1.5 text-xs">
                  {passwordLengthOk ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-destructive" />}
                  <span className={passwordLengthOk ? "text-primary" : "text-destructive"}>
                    {"1-10 characters"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {passwordHasNumeral ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-destructive" />}
                  <span className={passwordHasNumeral ? "text-primary" : "text-destructive"}>
                    At least 1 number (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {passwordHasSpecial ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-destructive" />}
                  <span className={passwordHasSpecial ? "text-primary" : "text-destructive"}>
                    {"At least 1 special character (!@#$%^&*)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Block & Flat Number */}
          <div className="space-y-2">
            <Label htmlFor="flat">Block & Flat Number</Label>
            <Input
              id="flat"
              placeholder="e.g. A-502, B-809"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value.toUpperCase())}
              onBlur={() => handleBlur("flat")}
              className={`bg-background/50 ${flatError ? "border-destructive" : touched.flat && flatValid ? "border-primary" : ""}`}
            />
            {flatError && (
              <p className="text-xs text-destructive">{flatError}</p>
            )}
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            onClick={handleSignup}
            disabled={loading || !canSubmit}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/")}
              className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
            >
              Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
