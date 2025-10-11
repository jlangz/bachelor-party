import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch event info
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('event_info')
      .select('*')
      .single();

    if (error) {
      console.error('Event info fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event info' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Event info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event info' },
      { status: 500 }
    );
  }
}

// PUT - Update event info (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...eventData } = body;

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get current event info ID
    const { data: currentInfo } = await supabase
      .from('event_info')
      .select('id')
      .single();

    if (!currentInfo) {
      return NextResponse.json(
        { error: 'Event info not found' },
        { status: 404 }
      );
    }

    // Update event info
    const { data, error } = await supabase
      .from('event_info')
      .update({
        ...eventData,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', currentInfo.id)
      .select()
      .single();

    if (error) {
      console.error('Event info update error:', error);
      return NextResponse.json(
        { error: 'Failed to update event info' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Event info update error:', error);
    return NextResponse.json(
      { error: 'Failed to update event info' },
      { status: 500 }
    );
  }
}
