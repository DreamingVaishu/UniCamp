export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?';

// 45000 -> "45,000"   |   money(45000) -> "₹45,000"
export const num = (v: any) => Number(v || 0).toLocaleString('en-IN');
export const money = (v: any) => `₹${num(v)}`;

export const dateText = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

// Supabase returns { data, error }. This returns data or throws the error,
// so screens can write one line instead of an if-block every time.
export function ok<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// Amount for one assigned fee. Supports the new simple schema and older fee rows.
export const feeAmount = (row: any) => {
  const f = row.fee_structures || {};
  const base = Number(row.amount ?? f.amount ?? (Number(f.tuition_fee || 0) + Number(f.admission_fee || 0)
    + Number(f.exam_fee || 0) + Number(f.transport_fee || 0) + Number(f.other_fee || 0)));
  return Math.max(0, base - Number(row.discount || 0));
};
