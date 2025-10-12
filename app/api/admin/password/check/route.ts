import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Check if admin user has a password set
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if password exists
    const { data: passwordData, error: passwordError } = await supabase
      .from('admin_passwords')
      .select('id')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      hasPassword: !!passwordData && !passwordError,
    });
  } catch (error) {
    console.error('Password check error:', error);
    return NextResponse.json(
      { error: 'Failed to check password' },
      { status: 500 }
    );
  }
}
