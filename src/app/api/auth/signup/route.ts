import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Client-side Firebase SDK handles signup directly' 
  }, { status: 200 });
}
