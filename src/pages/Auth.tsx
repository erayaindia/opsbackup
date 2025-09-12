import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Eye, EyeOff, Mail, Lock, Loader2, Shield, Zap, Users, TrendingUp } from 'lucide-react'

export default function AuthPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const isSigningInRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && isMounted) {
          // Silent redirect for existing sessions
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
    
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      
      // Redirect on sign in without any messages
      if (event === 'SIGNED_IN' && session) {
        setAuthError(null)
        setIsLoading(false)
        isSigningInRef.current = false
        navigate('/', { replace: true })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError(null)
    isSigningInRef.current = true
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })
      
      if (error) {
        setAuthError(error.message)
        setIsLoading(false)
        isSigningInRef.current = false
      }
      // Success case is handled by the auth state change listener
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
      isSigningInRef.current = false
    }
  }


  return (
    <div className="min-h-screen flex">
      {/* Left side - Enhanced Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-32 left-16 w-20 h-20 bg-white/10 rounded-full blur-md animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <div className="mb-10">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/30 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Eraya Ops Hub
              </h1>
              <p className="text-xl text-white/90 leading-relaxed mb-8">
                Transform your business operations with our intelligent management platform
              </p>
            </div>
            
            {/* Enhanced features with icons */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white font-semibold text-lg">Advanced Analytics Dashboard</span>
                  <p className="text-white/70 text-sm">Real-time insights and performance metrics</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white font-semibold text-lg">Team Collaboration</span>
                  <p className="text-white/70 text-sm">Connect and coordinate with your team</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-white font-semibold text-lg">Automated Workflows</span>
                  <p className="text-white/70 text-sm">Streamline processes and boost efficiency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced gradient overlay */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/30 via-black/10 to-transparent"></div>
      </div>

      {/* Right side - Enhanced Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-muted/5 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Enhanced Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Eraya Ops Hub</h2>
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Enter your credentials to access your dashboard
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full mx-auto"></div>
          </div>
          
          {authError && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {authMessage && (
            <Alert className="animate-fade-in border-success bg-success/10 text-success-foreground">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{authMessage}</AlertDescription>
            </Alert>
          )}
          
          <Card className="bg-card/70 backdrop-blur-xl border-border/50 shadow-2xl border-2 border-transparent bg-gradient-to-br from-card/80 via-card/60 to-card/80 hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.01]">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-12 h-14 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 border-2 hover:border-primary/30 bg-background/50 backdrop-blur-sm"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12 pr-12 h-14 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 border-2 hover:border-primary/30 bg-background/50 backdrop-blur-sm"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded-md hover:bg-primary/10"
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="remember" className="rounded border-gray-300" />
                        <label htmlFor="remember" className="text-muted-foreground">Remember me</label>
                      </div>
                      <a href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
                        Forgot Password?
                      </a>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isLoading || !email || !password}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <div className="ml-2 opacity-70">→</div>
                        </>
                      )}
                    </Button>
                  </form>
            </CardContent>
          </Card>

          {/* Enhanced Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Secure Login</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>24/7 Support</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p>
                By signing in, you agree to our{' '}
                <a href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground/70">
              © 2024 Eraya Ops Hub. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}