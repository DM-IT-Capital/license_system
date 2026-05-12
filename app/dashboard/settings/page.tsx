'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Key, Code, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const apiEndpoint = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/validate`
    : '/api/validate'

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const exampleCode = `// Validate a license in your application
const response = await fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    license_key: 'XXXX-XXXX-XXXX-XXXX',
    product_slug: 'ai-ddos-dashboard',
    machine_id: 'unique-machine-identifier',
    machine_name: 'User\\'s Computer'
  })
});

const result = await response.json();

if (result.valid) {
  console.log('License is valid!');
  console.log('Features:', result.features);
  console.log('Expires:', result.expires_at);
} else {
  console.error('License invalid:', result.error);
}`

  const offlineExample = `// Offline validation (no internet required)
const response = await fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    offline_package: 'base64-encoded-offline-license-package',
    product_slug: 'ai-ddos-dashboard'
  })
});

const result = await response.json();
// Works without internet connection using cryptographic signatures`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your license management system</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api" className="gap-2">
            <Code className="h-4 w-4" />
            API Integration
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Key className="h-4 w-4" />
            Product Slugs
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint</CardTitle>
              <CardDescription>
                Use this endpoint in your applications to validate licenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                  POST {apiEndpoint}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                >
                  {copied === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This endpoint supports both online validation (real-time) and offline validation (cryptographic signatures).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Online Validation Example</CardTitle>
                  <CardDescription>
                    Validate licenses in real-time with machine tracking
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(exampleCode, 'online')}
                >
                  {copied === 'online' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                <code>{exampleCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Offline Validation Example</CardTitle>
                  <CardDescription>
                    Validate licenses without internet using cryptographic signatures
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(offlineExample, 'offline')}
                >
                  {copied === 'offline' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                <code>{offlineExample}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Response Format</CardTitle>
              <CardDescription>What to expect from the validation endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-green-500">Successful Response</h4>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`{
  "valid": true,
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "product": "ai-ddos-dashboard",
  "product_name": "AI DDoS Dashboard",
  "tier": "pro",
  "tier_name": "Pro",
  "features": ["All Basic features", "Priority support", ...],
  "expires_at": "2025-12-31T23:59:59Z",
  "max_activations": 3,
  "current_activations": 1
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-red-500">Error Response</h4>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`{
  "valid": false,
  "error": "License has expired",
  "expired_at": "2024-12-31T23:59:59Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Product Slugs</CardTitle>
              <CardDescription>
                Use these slugs when validating licenses for specific products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">AI DDoS Dashboard</h4>
                    <p className="text-sm text-muted-foreground">Intelligent DDoS protection</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">ai-ddos-dashboard</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard('ai-ddos-dashboard', 'slug1')}
                    >
                      {copied === 'slug1' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">Customer Lifecycle Portal</h4>
                    <p className="text-sm text-muted-foreground">CRM and lifecycle tracking</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">customer-lifecycle-portal</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard('customer-lifecycle-portal', 'slug2')}
                    >
                      {copied === 'slug2' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">Digital Wedding Cards</h4>
                    <p className="text-sm text-muted-foreground">Wedding invitation system</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">digital-wedding-cards</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard('digital-wedding-cards', 'slug3')}
                    >
                      {copied === 'slug3' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>License Signature Secret</CardTitle>
              <CardDescription>
                Set a secret key for offline license validation signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret">Signature Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Set via LICENSE_SIGNATURE_SECRET env variable"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Set the LICENSE_SIGNATURE_SECRET environment variable for secure offline validation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Additional resources for integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Full API Documentation
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  SDK Integration Guides
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Webhook Configuration
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
