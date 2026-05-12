'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type LicenseStatus = 'active' | 'suspended' | 'expired' | 'revoked'

const statusConfig: Record<LicenseStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  suspended: { label: 'Suspended', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'outline' },
  revoked: { label: 'Revoked', variant: 'destructive' },
}

interface LicenseStatusBadgeProps {
  status: LicenseStatus
  className?: string
}

export function LicenseStatusBadge({ status, className }: LicenseStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        status === 'active' && 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
        status === 'suspended' && 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
        status === 'expired' && 'bg-muted text-muted-foreground',
        status === 'revoked' && 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
