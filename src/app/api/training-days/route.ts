import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function jsonNotFound() {
  return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
}

export async function GET(req: Request) {
  void req;
  return jsonNotFound();
}

export async function POST(req: Request) {
  void req;
  return jsonNotFound();
}
