import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker and monitoring
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'dna-app',
    },
    { status: 200 }
  );
}
