import { NextResponse } from 'next/server';
import { transactionDb } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { product_id } = body;

    if (!product_id) {
        return NextResponse.json({ message: "product_id is required" }, { status: 400 });
    }

    const transaction = await transactionDb.getByProductId(product_id);
    if (!transaction) {
        return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    // Dynamically import esewajs
    const esewajs = await import("esewajs");
    const EsewaCheckStatus = esewajs.EsewaCheckStatus;

    // Check payment status
    const paymentStatusCheck = await EsewaCheckStatus(
        transaction.amount,
        transaction.product_id,
        process.env.MERCHANT_ID,
        process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    if (!paymentStatusCheck?.data?.status) {
        return NextResponse.json({ message: "Invalid API response from eSewa" }, { status: 400 });
    }
    
    console.log("API Response Status:", paymentStatusCheck.data.status);

    if (paymentStatusCheck.status === 200) {
        const newStatus = paymentStatusCheck.data.status.toUpperCase();

        if (!["PENDING", "COMPLETE", "FAILED", "REFUNDED"].includes(newStatus)) {
            return NextResponse.json({ message: "Invalid transaction status" }, { status: 400 });
        }

        // Update the transaction status
        await transactionDb.updateStatus(transaction.product_id, newStatus);
        
        return NextResponse.json({ message: "Transaction status updated successfully", status: newStatus }, { status: 200 });
    } else {
        return NextResponse.json({ message: "eSewa status check failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating transaction status:", error.message || error);
    return NextResponse.json({ message: "Server error updating status", error: error.message }, { status: 500 });
  }
}
