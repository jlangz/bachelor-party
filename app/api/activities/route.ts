import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all active activities
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Activities fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST - Create new activity (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      activity_type,
      participation_options,
      icon,
      when_datetime,
      when_description,
      cost,
      cost_description,
      location,
      additional_notes,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Activity name required' },
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

    // Convert participation_options to proper format if they're strings or objects with text property
    let formattedOptions = participation_options || ['participating', 'watching', 'not_attending'];
    if (Array.isArray(formattedOptions)) {
      formattedOptions = formattedOptions.map((opt: any) => {
        if (typeof opt === 'string') {
          return { id: opt, text: opt };
        } else if (opt && typeof opt === 'object' && opt.text) {
          return { id: opt.id || opt.text, text: opt.text };
        }
        return opt;
      });
    }

    // Get the max display_order to add new activity at the end
    const { data: maxOrderData } = await supabase
      .from('activities')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newDisplayOrder = (maxOrderData?.display_order || 0) + 1;

    // Create activity
    const { data, error } = await supabase
      .from('activities')
      .insert({
        name,
        description: description || null,
        activity_type: activity_type || 'participatory',
        participation_options: formattedOptions,
        icon: icon || 'Trophy',
        when_datetime: when_datetime || null,
        when_description: when_description || null,
        cost: cost || null,
        cost_description: cost_description || null,
        location: location || null,
        additional_notes: additional_notes || null,
        display_order: newDisplayOrder,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Activity create error:', error);
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Activity create error:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
