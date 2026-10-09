// Simple dropdown lists. Keep these values in sync with enums in supabase/schema.sql.
export const DEPARTMENTS = [
  'Computer Science & IT',
  'Management',
  'Law',
  'Science',
  'Nursing',
] as const;

export const COURSES = [
  'BCA',
  'BSc IT',
  'B.Tech',
  'MCA',
  'M.Tech',
  'Nursing',
  'LAW',
] as const;

export const DIVISIONS = ['A', 'B', 'C', 'D'] as const;
export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export const FEE_TYPES = ['tuition', 'admission', 'exam', 'transport', 'library', 'other'] as const;
export const STUDENT_STATUSES = ['active', 'inactive', 'suspended', 'graduated'] as const;
export const FEE_STATUSES = ['pending', 'partial', 'paid', 'overdue', 'cancelled'] as const;
export const PAYMENT_METHODS = ['cash', 'online', 'razorpay', 'upi'] as const;
export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'refunded'] as const;
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const;
export const RESULT_STATUSES = ['pass', 'fail', 'absent', 'withheld'] as const;
