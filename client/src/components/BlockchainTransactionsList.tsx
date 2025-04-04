import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BlockchainTransaction } from '@shared/schema';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function BlockchainTransactionsList() {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Fetch user's blockchain transactions
  const { data: transactions, isLoading, error } = useQuery<BlockchainTransaction[]>({
    queryKey: ['/api/blockchain/user/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/blockchain/user/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch blockchain transactions');
      }
      return response.json();
    },
  });

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (txId: string) => {
      const response = await fetch(`/api/blockchain/transactions/${txId}/confirm`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to confirm transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Delivery confirmed',
        description: 'The transaction has been successfully confirmed on the blockchain',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/user/transactions'] });
      setSelectedTransaction(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Confirmation failed',
        description: error.message || 'Failed to confirm the transaction',
        variant: 'destructive',
      });
    },
  });

  // Verify transaction mutation
  const verifyTransactionMutation = useMutation({
    mutationFn: async (txId: string) => {
      const response = await fetch(`/api/blockchain/transactions/${txId}/verify`);
      if (!response.ok) {
        throw new Error('Failed to verify transaction');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Transaction verified',
        description: `Verification status: ${data.status}`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/user/transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification failed',
        description: error.message || 'Failed to verify the transaction',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading blockchain transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 border border-red-200">
        <h3 className="text-red-800 font-medium">Error loading transactions</h3>
        <p className="text-red-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center p-8 rounded-md bg-gray-50 border border-gray-200">
        <p className="text-gray-500">No blockchain transactions found.</p>
        <p className="text-gray-400 text-sm mt-2">Transactions will appear here when you make purchases with blockchain payment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Blockchain Transactions</h2>
      <p className="text-gray-500">View and manage your secure blockchain transactions</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-md truncate" title={transaction.id}>
                  ID: {transaction.id.substring(0, 8)}...
                </CardTitle>
                {getStatusBadge(transaction.status)}
              </div>
              <CardDescription>
                {formatDate(transaction.createdAt?.toString() || null)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{formatAmount(transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network:</span>
                  <span>{transaction.networkId}</span>
                </div>
                {transaction.txHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction Hash:</span>
                    <span className="truncate max-w-[150px]" title={transaction.txHash}>
                      {transaction.txHash.substring(0, 8)}...
                    </span>
                  </div>
                )}
                {transaction.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Block Number:</span>
                    <span>{transaction.blockNumber}</span>
                  </div>
                )}
                {transaction.productId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product ID:</span>
                    <span>{transaction.productId}</span>
                  </div>
                )}
                {transaction.orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID:</span>
                    <span>{transaction.orderId}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => verifyTransactionMutation.mutate(transaction.id)}
                disabled={verifyTransactionMutation.isPending && selectedTransaction === transaction.id}
              >
                {verifyTransactionMutation.isPending && selectedTransaction === transaction.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Verify
              </Button>
              {transaction.status !== 'confirmed' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedTransaction(transaction.id);
                    confirmDeliveryMutation.mutate(transaction.id);
                  }}
                  disabled={confirmDeliveryMutation.isPending && selectedTransaction === transaction.id}
                >
                  {confirmDeliveryMutation.isPending && selectedTransaction === transaction.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Confirm
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}