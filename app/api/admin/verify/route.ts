import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session');

    if (sessionToken && sessionToken.value) {
      // Simple session validation (in production, verify JWT or check database)
      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
