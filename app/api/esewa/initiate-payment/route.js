import { NextResponse } from 'next/server';
import { transactionDb } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, productId, userId, type, note } = body;

    if (!amount || !productId || !userId) {
      return NextResponse.json({ message: "Missing required fields: amount, productId, or userId" }, { status: 400 });
    }

    // Dynamically import esewajs
    const esewajs = await import("esewajs");
    const EsewaPaymentGateway = esewajs.EsewaPaymentGateway;
    
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const successUrl = `${origin}/payment-success`;
    const failureUrl = `${origin}/payment-failure`;

    const reqPayment = await EsewaPaymentGateway(
        amount,
        0,
        0,
        0,
        productId,
        process.env.MERCHANT_ID,
        process.env.SECRET,
        successUrl,
        failureUrl,
        process.env.ESEWAPAYMENT_URL,
        undefined,
        undefined
    );

    if (!reqPayment) {
        return NextResponse.json({ message: "Error sending data to eSewa" }, { status: 400 });
    }

    if (reqPayment.status === 200) {
        // Save to Database
        await transactionDb.create({
            product_id: productId,
            amount,
            userId,
            status: 'PENDING',
            ...(type && { type }),
            ...(note && { note })
        });
        console.log("Transaction saved successfully");

        return NextResponse.json({
            url: reqPayment.request.res.responseUrl,
        });
    } else {
        return NextResponse.json({ message: "eSewa didn't return 200 status" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error initiating payment:", error.message || error);
    return NextResponse.json({ message: "Error initiating payment", error: error.message }, { status: 500 });
  }
}
