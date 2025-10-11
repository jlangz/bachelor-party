import { supabase, User } from './supabase';

// Format phone number to consistent format (remove all non-digits)
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Validate phone number (must be 10 digits)
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = formatPhoneNumber(phone);
  return cleaned.length === 10;
}

// Display phone number in readable format
export function displayPhoneNumber(phone: string): string {
  const cleaned = formatPhoneNumber(phone);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Login or create user
export async function loginOrCreateUser(
  phoneNumber: string,
  name?: string
): Promise<{ user: User | null; error: string | null; isNewUser: boolean }> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  if (!isValidPhoneNumber(formattedPhone)) {
    return { user: null, error: 'Please enter a valid 10-digit phone number', isNewUser: false };
  }

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', formattedPhone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is fine
      console.error('Error fetching user:', fetchError);
      return { user: null, error: 'Failed to check user. Please try again.', isNewUser: false };
    }

    // User exists, return them
    if (existingUser) {
      return { user: existingUser, error: null, isNewUser: false };
    }

    // User doesn't exist, create new user
    if (!name || name.trim().length === 0) {
      return { user: null, error: 'Please enter your name', isNewUser: true };
    }

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{ phone_number: formattedPhone, name: name.trim() }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return { user: null, error: 'Failed to create account. Please try again.', isNewUser: true };
    }

    // Create default RSVP and activity signups for new user
    await Promise.all([
      supabase.from('rsvps').insert([{ user_id: newUser.id }]),
      supabase.from('activity_signups').insert([
        { user_id: newUser.id, activity_type: 'shooting' },
        { user_id: newUser.id, activity_type: 'show' },
      ]),
    ]);

    return { user: newUser, error: null, isNewUser: true };
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return { user: null, error: 'An unexpected error occurred. Please try again.', isNewUser: false };
  }
}
