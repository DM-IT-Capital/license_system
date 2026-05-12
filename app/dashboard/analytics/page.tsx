'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, TrendingDown, Activity, Globe } from 'lucide-react'
import type { LicenseValidationLog } from '@/lib/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const { data: stats } = useSWR('/api/stats', fetcher, { refreshInterval: 60000 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validationStats = stats?.recentValidations?.reduce((acc: Record<string, number>, log: LicenseValidationLog) => {
    acc[log.validation_result] = (acc[log.validation_result] || 0) + 1
    return acc
  }, {}) || {}

  const successRate = stats?.recentValidations?.length > 0
    ? Math.round((validationStats.valid || 0) / stats.recentValidations.length * 100)
    : 0

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">License usage insights and validation metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalValidations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.validationsToday || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {validationStats.valid || 0} successful validations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Failed Validations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {(validationStats.invalid || 0) + (validationStats.not_found || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {validationStats.expired || 0} expired, {validationStats.suspended || 0} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.licensesByProduct?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With active licenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Validation Trends
          </CardTitle>
          <CardDescription>Daily validation attempts over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {stats?.validationsByDay?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.validationsByDay}>
                  <defs>
                    <linearGradient id="validGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="invalidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                  <Area type="monotone" dataKey="valid" name="Valid" stroke="#22c55e" fill="url(#validGradient)" />
                  <Area type="monotone" dataKey="invalid" name="Invalid" stroke="#ef4444" fill="url(#invalidGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No validation data yet. Data will appear here as your systems validate licenses.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>Breakdown of recent validation attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(validationStats).map(([result, count]) => (
                <div key={result} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={result === 'valid' ? 'default' : 'destructive'}
                      className={result === 'valid' ? 'bg-green-500/10 text-green-500' : ''}
                    >
                      {result}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${result === 'valid' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{
                          width: `${stats?.recentValidations?.length ? ((count as number) / stats.recentValidations.length * 100) : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                  </div>
                </div>
              ))}
              {Object.keys(validationStats).length === 0 && (
                <p className="text-muted-foreground text-center py-4">No validation data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licenses by Product</CardTitle>
            <CardDescription>Active license distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.licensesByProduct?.map((item: { product: string; count: number }) => (
                <div key={item.product} className="flex items-center justify-between">
                  <span className="font-medium">{item.product}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${stats.activeLicenses ? (item.count / stats.activeLicenses * 100) : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
              {(!stats?.licensesByProduct || stats.licensesByProduct.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No license data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
