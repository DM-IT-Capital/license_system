import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Key, Users, BarChart3, Zap, Lock, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user is admin
    const { data: adminUserById } = await supabase
      .from('admin_users')
      .select()
      .eq('id', user.id)
      .maybeSingle()

    let adminUser = adminUserById

    if (!adminUser && user.email) {
      const { data: adminUserByEmail } = await supabase
        .from('admin_users')
        .select()
        .eq('email', user.email)
        .maybeSingle()

      adminUser = adminUserByEmail
    }

    if (adminUser) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LicenseHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Software License Management Made Simple
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
            Protect Your Software with Powerful License Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Generate, validate, and manage software licenses for your products. 
            Support for both online and offline validation with real-time analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Start Managing Licenses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for License Management
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 bg-card rounded-xl border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">License Generation</h3>
              <p className="text-muted-foreground">
                Generate unique license keys with customizable formats. Support for perpetual and subscription-based licenses.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Online & Offline Validation</h3>
              <p className="text-muted-foreground">
                Real-time license validation via API, plus cryptographic offline validation for air-gapped environments.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
              <p className="text-muted-foreground">
                Track customers, their licenses, and activation history. Easily manage renewals and upgrades.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
              <p className="text-muted-foreground">
                Monitor validation attempts, track usage patterns, and gain insights into license utilization.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Product Tiers</h3>
              <p className="text-muted-foreground">
                Create multiple pricing tiers with different features, activation limits, and subscription durations.
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Integration</h3>
              <p className="text-muted-foreground">
                Simple REST API for validating licenses. Just a few lines of code to protect your software.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pre-configured for Your Products</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            LicenseHub comes ready to manage licenses for all your software products
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border bg-gradient-to-br from-blue-500/10 to-transparent">
              <h3 className="text-lg font-semibold mb-2">AI DDoS Dashboard</h3>
              <p className="text-sm text-muted-foreground">Intelligent threat protection</p>
            </div>
            <div className="p-6 rounded-xl border bg-gradient-to-br from-green-500/10 to-transparent">
              <h3 className="text-lg font-semibold mb-2">Customer Lifecycle Portal</h3>
              <p className="text-sm text-muted-foreground">CRM & lifecycle tracking</p>
            </div>
            <div className="p-6 rounded-xl border bg-gradient-to-br from-pink-500/10 to-transparent">
              <h3 className="text-lg font-semibold mb-2">Digital Wedding Cards</h3>
              <p className="text-sm text-muted-foreground">Beautiful digital invitations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Protect Your Software?</h2>
          <p className="text-muted-foreground mb-8">
            Create your admin account and start managing licenses in minutes.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Create Admin Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">LicenseHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Software License Management System
          </p>
        </div>
      </footer>
    </div>
  )
}
