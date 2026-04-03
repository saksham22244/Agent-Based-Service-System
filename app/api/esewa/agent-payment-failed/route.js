import { NextResponse } from 'next/server';
import { transactionDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, amount, error } = body;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Find and update the pending transaction
    const allTransactions = await transactionDb.getAll();
    const pendingTransaction = allTransactions.transactions?.find(t => 
      t.product_id === productId && t.status === 'PENDING' && t.type === 'agent_payment'
    );

    if (pendingTransaction) {
      await transactionDb.update(pendingTransaction.id, {
        status: 'FAILED',
        error: error || 'Payment failed',
        failedAt: new Date()
      });
    }

    return NextResponse.json({
      message: 'Payment failure recorded',
      productId,
      amount,
      error
    });

  } catch (error) {
    console.error('Error recording agent payment failure:', error);
    return NextResponse.json({ error: 'Failed to record payment failure' }, { status: 500 });
  }
}
