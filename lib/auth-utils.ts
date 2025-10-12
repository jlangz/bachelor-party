import { supabase, User } from './supabase';

// Format phone number to consistent format with country code
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // If it starts with 1 and has 11 digits, it's already formatted US (+1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If it starts with 47 and has 10 digits, it's already formatted Norwegian (+47)
  if (cleaned.length === 10 && cleaned.startsWith('47')) {
    return `+${cleaned}`;
  }

  // If it's 10 digits, assume US and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If it's 8 digits, assume Norwegian and add +47
  if (cleaned.length === 8) {
    return `+47${cleaned}`;
  }

  return phone;
}

// Validate phone number (US: 10 digits, Norwegian: 8 digits)
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's either 8 digits (Norwegian), 10 digits (US), or already formatted with country code
  return cleaned.length === 8 ||
         cleaned.length === 10 ||
         (cleaned.length === 11 && cleaned.startsWith('1')) ||
         (cleaned.length === 10 && cleaned.startsWith('47'));
}

// Display phone number in readable format
export function displayPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // US format with country code: +1 (555) 123-4567
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }

  // Norwegian format with country code: +47 95 45 50 57
  if (cleaned.length === 10 && cleaned.startsWith('47')) {
    const number = cleaned.slice(2);
    return `+47 ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6)}`;
  }

  // Legacy US format without country code: (555) 123-4567
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Legacy Norwegian format without country code: 95 45 50 57
  if (cleaned.length === 8) {
    return `+47 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
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
    return { user: null, error: 'Please enter a valid phone number (US: 10 digits, Norwegian: 8 digits)', isNewUser: false };
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

    // User doesn't exist - not on the guest list
    return {
      user: null,
      error: 'This phone number is not on the guest list. Please contact the organizer if you should have access.',
      isNewUser: false
    };
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return { user: null, error: 'An unexpected error occurred. Please try again.', isNewUser: false };
  }
}

// Update user name
export async function updateUserName(
  userId: string,
  newName: string
): Promise<{ user: User | null; error: string | null }> {
  const trimmedName = newName.trim();

  if (!trimmedName || trimmedName.length === 0) {
    return { user: null, error: 'Name cannot be empty' };
  }

  try {
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ name: trimmedName })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user name:', updateError);
      return { user: null, error: 'Failed to update name. Please try again.' };
    }

    return { user: updatedUser, error: null };
  } catch (error) {
    console.error('Unexpected error updating name:', error);
    return { user: null, error: 'An unexpected error occurred. Please try again.' };
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) {
    return true; // Email is optional
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Update user profile (name, email, and note)
export async function updateUserProfile(
  userId: string,
  newName: string,
  newEmail?: string | null,
  newNote?: string | null
): Promise<{ user: User | null; error: string | null }> {
  const trimmedName = newName.trim();
  const trimmedEmail = newEmail?.trim() || null;
  const trimmedNote = newNote?.trim() || null;

  if (!trimmedName || trimmedName.length === 0) {
    return { user: null, error: 'Name cannot be empty' };
  }

  if (trimmedEmail && !isValidEmail(trimmedEmail)) {
    return { user: null, error: 'Please enter a valid email address' };
  }

  if (trimmedNote && trimmedNote.length > 100) {
    return { user: null, error: 'Note must be 100 characters or less' };
  }

  try {
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ name: trimmedName, email: trimmedEmail, note: trimmedNote })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return { user: null, error: 'Failed to update profile. Please try again.' };
    }

    return { user: updatedUser, error: null };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { user: null, error: 'An unexpected error occurred. Please try again.' };
  }
}
