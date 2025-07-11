
'use client';

import { useAdminData, AdminPageWrapper } from '@/utils/adminPageTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Building, 
  Users, 
  AlertCircle
} from 'lucide-react';

interface BillingData {
  monthlyRevenue: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  recentTransactions: Array<{
    id: string;
    company: string;
    amount: number;
    status: string;
    date: string;
    plan: string;
  }>;
}

export default function AdminBillingPage() {
  const { data: billingData, isLoading, error, refetch } = useAdminData<BillingData>({
    endpoint: '/api/admin/billing'
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminPageWrapper
      title="Billing & Payments"
      description="Monitor platform revenue, subscriptions, and payment processing"
      icon={CreditCard}
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingData?.monthlyRevenue.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billingData?.totalRevenue.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Companies subscribed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingData?.recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.company}</TableCell>
                  <TableCell>{transaction.plan}</TableCell>
                  <TableCell>${transaction.amount}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
