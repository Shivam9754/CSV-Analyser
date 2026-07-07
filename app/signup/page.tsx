// app/signup/page.tsx
'use client'

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, Globe, Phone } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SignUpPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/statistical-analysis")
    }
  }, [status, router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !country || !phone) {
      toast.error("Please fill in all fields")
      return
    }

    setRegistering(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, country, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      toast.success("Account created successfully! Redirecting...")
      router.push("/login")
    } catch (err: any) {
      toast.error(err.message || "Failed to create account")
    } finally {
      setRegistering(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl: "/statistical-analysis" })
    } catch (error) {
      console.error(error)
      toast.error("Google Sign-In failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090a16] p-4 text-white">
      <Card className="w-full max-w-md border-primary/20 bg-gradient-to-b from-[#13152d]/90 to-[#0e1022]/90 backdrop-blur-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Get started with Conversational BI insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 bg-background/50 h-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-background/50 h-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-background/50 h-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Country</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  placeholder="United States" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="pl-9 bg-background/50 h-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 bg-background/50 h-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-10 gap-2 animate-none" disabled={registering || loading}>
              {registering ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Create Account with Email
            </Button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or sign up with</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-10 border-primary/20 hover:bg-primary/10 gap-2 font-medium" 
            onClick={handleGoogleSignUp}
            disabled={loading || registering}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Sign Up with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}