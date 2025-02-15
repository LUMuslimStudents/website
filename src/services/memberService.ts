import { Member } from '@/types/member';

export const saveMember = async (memberData: Omit<Member, 'id' | 'joinDate' | 'membershipStatus' | 'paymentStatus'>) => {
  try {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...memberData,
        joinDate: new Date(),
        membershipStatus: 'active',
        paymentStatus: 'pending',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save member data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving member:', error);
    throw error;
  }
}; 