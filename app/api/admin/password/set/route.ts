import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Set or update admin password
export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Check if password already exists
    const { data: existingPassword, error: checkError } = await supabase
      .from('admin_passwords')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If updating existing password, verify current password
    if (existingPassword && !checkError) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password required' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        existingPassword.password_hash
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      // Update existing password
      const newHash = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabase
        .from('admin_passwords')
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Password update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    } else {
      // Create new password
      const newHash = await bcrypt.hash(newPassword, 10);
      const { error: insertError } = await supabase
        .from('admin_passwords')
        .insert({
          user_id: userId,
          password_hash: newHash,
        });

      if (insertError) {
        console.error('Password insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to set password' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password set successfully',
      });
    }
  } catch (error) {
    console.error('Password set error:', error);
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    );
  }
}
