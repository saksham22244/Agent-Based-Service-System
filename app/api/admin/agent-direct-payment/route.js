import { NextResponse } from 'next/server';
import { agentDb, transactionDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { agentId, amount, note } = body;

    if (!agentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Agent ID and valid amount are required' },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = await agentDb.getById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Update agent paid amounts
    const newTotalPaid = (agent.totalPaid || 0) + amount;
    await agentDb.update(agentId, { totalPaid: newTotalPaid });

    // Create transaction record
    const transaction = await transactionDb.create({
      product_id: `direct_payment_${Date.now()}`,
      amount,
      userId: agentId,
      status: 'COMPLETE',
      type: 'direct_payment',
      note: note || 'Direct payment from admin',
      createdAt: new Date()
    });

    return NextResponse.json({
      message: 'Direct payment processed successfully',
      payment: {
        id: transaction.id,
        agentId,
        amount,
        note: note || 'Direct payment from admin',
        previousPaid: agent.totalPaid || 0,
        newTotalPaid
      }
    });

  } catch (error) {
    console.error('Error processing direct agent payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
