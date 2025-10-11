import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { password, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - not an admin' }, { status: 403 });
    }

    // Password is required for admins
    if (!password) {
      return NextResponse.json(
        { error: 'Password required for admin access' },
        { status: 400 }
      );
    }

    // Check password against environment variable
    const adminPassword = process.env.NEXT_PRIVATE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password not configured in environment variables' },
        { status: 500 }
      );
    }

    // Simple password check
    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Create a simple session token
    const sessionToken = Buffer.from(`admin-${userId}-${Date.now()}`).toString('base64');

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
