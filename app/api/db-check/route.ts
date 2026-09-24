import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state === 1) {
      return NextResponse.json({
        status: "connected",
        database: mongoose.connection.name || "closet_digital",
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: "disconnected",
        state,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: "disconnected",
      error: error.message || 'Error connecting to MongoDB',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
