'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { StatsCard } from '@/components/dashboard/stats-card'
import { LicenseStatusBadge } from '@/components/dashboard/license-status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Users, Activity, TrendingUp, Package, CheckCircle } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const { data: stats, isLoading } = useSWR<DashboardStats>('/api/stats', fetcher, {
    refreshInterval: 30000
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoading || !stats || !mounted) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your license management system</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your license management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Licenses"
          value={stats.totalLicenses}
          icon={Key}
          description="All time"
        />
        <StatsCard
          title="Active Licenses"
          value={stats.activeLicenses}
          icon={CheckCircle}
          description="Currently active"
        />
        <StatsCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Registered customers"
        />
        <StatsCard
          title="Validations Today"
          value={stats.validationsToday}
          icon={Activity}
          description={`${stats.totalValidations} total`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Validations Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Validation Trends
            </CardTitle>
            <CardDescription>License validations over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.validationsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.validationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="valid" name="Valid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="invalid" name="Invalid" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No validation data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Licenses by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Licenses by Product
            </CardTitle>
            <CardDescription>Distribution of active licenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.licensesByProduct.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.licensesByProduct}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="product"
                      label={({ product, count }) => `${product}: ${count}`}
                    >
                      {stats.licensesByProduct.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No license data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Validations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Validations
          </CardTitle>
          <CardDescription>Latest license validation attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentValidations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentValidations.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm">{log.license_key}</div>
                    <LicenseStatusBadge
                      status={log.validation_result === 'valid' ? 'active' : log.validation_result === 'expired' ? 'expired' : log.validation_result === 'suspended' ? 'suspended' : 'revoked'}
                    />
                    {log.product_slug && (
                      <span className="text-sm text-muted-foreground">{log.product_slug}</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.validated_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No validation logs yet. Validations will appear here when your systems check licenses.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
