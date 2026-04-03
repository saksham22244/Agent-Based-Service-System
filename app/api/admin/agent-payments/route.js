import { NextResponse } from 'next/server';
import { transactionDb, agentDb } from '@/lib/db';

export async function GET(request) {
  try {
    // Get all agent-related transactions
    const allTransactions = await transactionDb.getAll();
    
    // Filter for agent payments (both work completion and direct payments)
    const agentPayments = allTransactions.transactions?.filter(transaction => 
      transaction.type === 'agent_payment' || transaction.type === 'direct_payment'
    ) || [];

    // Get agent details for each payment
    const paymentsWithAgentDetails = await Promise.all(
      agentPayments.map(async (payment) => {
        const agent = await agentDb.getById(payment.userId);
        return {
          ...payment,
          agentName: agent?.name || 'Unknown Agent',
          agentEmail: agent?.email || 'N/A'
        };
      })
    );

    // Sort by date (newest first)
    paymentsWithAgentDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json(paymentsWithAgentDetails);

  } catch (error) {
    console.error('Error fetching agent payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent payments' },
      { status: 500 }
    );
  }
}
