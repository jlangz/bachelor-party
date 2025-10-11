import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch event info
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('event_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Event info fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event info' },
        { status: 500 }
      );
    }

    if (!data) {
      // Return default empty structure if no event info exists
      return NextResponse.json({
        event_name: 'Bachelor Party',
        short_description: '',
        event_date_start: null,
        event_date_end: null,
        event_date_start_time: null,
        event_date_end_time: null,
        location_name: '',
        location_address: '',
        airbnb_house_name: '',
        airbnb_address: '',
        description: '',
        house_beds_total: 11,
        rich_description: { type: 'doc', content: [] },
        schedule: [],
        important_info: [],
      });
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
    const { data: currentInfo, error: fetchError } = await supabase
      .from('event_info')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current event info:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch event info' },
        { status: 500 }
      );
    }

    if (!currentInfo) {
      return NextResponse.json(
        { error: 'Event info not found. Please run the database migration to create a default event info record.' },
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
      .maybeSingle();

    if (error) {
      console.error('Event info update error:', error);
      return NextResponse.json(
        { error: 'Failed to update event info' },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('Event info update returned no data');
      return NextResponse.json(
        { error: 'Update failed - no data returned' },
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
