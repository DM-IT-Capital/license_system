'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LicenseStatusBadge } from '@/components/dashboard/license-status-badge'
import { Copy, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { License } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LicenseDetailPage() {
  const params = useParams()
  const licenseId = params?.id
  const { data: license, error } = useSWR<License>(
    licenseId ? `/api/licenses/${licenseId}` : null,
    fetcher,
  )

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    toast.success('License key copied to clipboard')
  }

  if (error) {
    return (
      <div className="min-h-[60vh] p-6">
        <Card>
          <CardContent>
            <h1 className="text-xl font-semibold mb-4">License detail</h1>
            <p className="text-sm text-destructive">Unable to load license details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!license) {
    return (
      <div className="min-h-[60vh] p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading license details...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">License Details</h1>
          <p className="text-muted-foreground mt-1">Review the selected license and its current status.</p>
        </div>
        <Link href="/dashboard/licenses">
          <Button variant="outline" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to licenses
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Key & Status</CardTitle>
            <CardDescription>License key, validity, and product details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">License key</p>
                  <p className="font-mono break-all text-sm">{license.license_key}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyKey(license.license_key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <LicenseStatusBadge status={license.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span>{license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activations</span>
                <span>{license.current_activations} / {license.max_activations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subscription</span>
                <Badge variant={license.is_subscription ? 'default' : 'secondary'}>
                  {license.is_subscription ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
              <CardDescription>Customer and related product information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{license.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{license.customer?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{license.product?.name}</p>
                <p className="text-sm text-muted-foreground">{license.product?.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tier</p>
                <p className="font-medium">{license.tier?.name}</p>
                <p className="text-sm text-muted-foreground">{license.tier?.slug}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>License metadata</CardTitle>
              <CardDescription>Extra fields and created timestamps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{new Date(license.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p>{new Date(license.updated_at).toLocaleString()}</p>
              </div>
              {license.metadata && Object.keys(license.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Metadata</p>
                  <pre className="rounded-md border bg-muted p-3 text-sm overflow-x-auto">{JSON.stringify(license.metadata, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
