export interface Member {
  id: string;
  fullName: string;
  studyProgram: string;
  schoolEmail: string;
  phoneNumber: string;
  joinDate: Date;
  membershipStatus: 'active' | 'expired';
  paymentStatus: 'pending' | 'completed';
} 