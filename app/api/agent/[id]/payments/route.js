import { NextResponse } from 'next/server';
import { transactionDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Get all transactions
    const allTransactions = await transactionDb.getAll();
    
    // Filter for this agent's payments (both work completion and direct payments)
    const agentPayments = allTransactions.transactions?.filter(transaction => 
      transaction.userId === id && 
      (transaction.type === 'agent_payment' || transaction.type === 'direct_payment')
    ) || [];

    // Sort by date (newest first)
    agentPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json(agentPayments);

  } catch (error) {
    console.error('Error fetching agent payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent payments' },
      { status: 500 }
    );
  }
}
