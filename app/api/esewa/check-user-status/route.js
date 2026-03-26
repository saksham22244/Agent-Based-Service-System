import { NextResponse } from 'next/server';
import { transactionDb } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: "userId query parameter is required" }, { status: 400 });
    }

    // Find the most recent complete transaction for the user
    const transaction = await transactionDb.getRecentCompleteByUser(userId);

    if (!transaction) {
        return NextResponse.json({ status: 'PENDING' }, { status: 200 });
    }

    // Check if the transaction is recent (within last 24 hours)
    const transactionDate = new Date(transaction.createdAt);
    const isRecent = (new Date() - transactionDate) < 24 * 60 * 60 * 1000;
    
    return NextResponse.json({ 
        status: isRecent ? 'COMPLETE' : 'PENDING'
    }, { status: 200 });

  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json({ message: "Error checking payment status", error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
    try {
      const body = await req.json();
      const userId = body.userId;
  
      if (!userId) {
          return NextResponse.json({ message: "userId is required in request body" }, { status: 400 });
      }
  
      const transaction = await transactionDb.getRecentCompleteByUser(userId);
  
      if (!transaction) {
          return NextResponse.json({ status: 'PENDING' }, { status: 200 });
      }
  
      const transactionDate = new Date(transaction.createdAt);
      const isRecent = (new Date() - transactionDate) < 24 * 60 * 60 * 1000;
      
      return NextResponse.json({ 
          status: isRecent ? 'COMPLETE' : 'PENDING'
      }, { status: 200 });
  
    } catch (error) {
      console.error("Error checking payment status:", error);
      return NextResponse.json({ message: "Error checking payment status", error: error.message }, { status: 500 });
    }
}
