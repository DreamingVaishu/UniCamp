import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import Sheet from '../../components/Sheet';
import { Empty, Loading } from '../../components/Status';
import { supabase } from '../../lib/supabase';
import { userId } from '../../lib/auth';
import { dateText, feeAmount, money, num, ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C } from '../../lib/theme';

export default function Fees() {
  const [typed, setTyped] = useState<string | null>(null); // amount the student typed
  const [showReceipts, setShowReceipts] = useState(false);

  const q = useLoad(async () => {
    const id = await userId();
    const fees = ok(await supabase.from('student_fees').select('*, fee_structures(*)').eq('student_id', id).order('due_date'));
    const payments = ok(await supabase.from('payments').select('*').eq('student_id', id).order('created_at', { ascending: false }));
    return { fees, payments };
  }, { fees: [] as any[], payments: [] as any[] });

  const { fees, payments } = q.data;
  const active = fees.filter((x: any) => x.status !== 'cancelled');
  const total = active.reduce((sum: number, x: any) => sum + feeAmount(x), 0);
  const pending = active.filter((x: any) => x.status !== 'paid').reduce((sum: number, x: any) => sum + feeAmount(x), 0);

  const amount = typed ?? String(pending);
  const value = Number(amount);
  const valid = value > 0 && value <= pending;

  const pay = () => {
    // Real payment must run on your server (Supabase Edge Function + Razorpay):
    //   1. server creates the order   2. app opens Razorpay   3. server verifies the signature and marks paid.
    // Never mark a fee "paid" from this app.
    Alert.alert('Payments', 'Online payment is not connected yet.');
  };

  return (
    <Screen>
      <Header title="Fees" right={
        <Pressable onPress={() => setShowReceipts(true)} hitSlop={10} accessibilityRole="button">
          <Text style={{ color: C.text }}>Receipts  ›</Text>
        </Pressable>} />

      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ backgroundColor: C.navy, margin: 13, marginTop: 6, borderRadius: 18, padding: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#C9CAD8' }}>Pending</Text>
              <Text style={{ color: C.white, fontSize: 32, marginTop: 4 }}>{num(pending)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#C9CAD8' }}>Total fee</Text>
              <Text style={{ color: C.white, fontSize: 22, marginTop: 4 }}>{num(total)}</Text>
            </View>
          </View>

          <View style={{ backgroundColor: C.field, height: 40, borderRadius: 9, marginTop: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
            <TextInput value={amount} onChangeText={t => setTyped(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" accessibilityLabel="Amount to pay"
              style={{ flex: 1, color: '#55556A', fontWeight: '600', fontSize: 15 }} />
            <Text style={{ fontSize: 17, fontWeight: '700' }}>₹</Text>
          </View>
          {!valid && pending > 0 && <Text style={{ color: '#F2B8B5', fontSize: 12, marginTop: 6 }}>Enter an amount up to {money(pending)}.</Text>}

          <Pressable onPress={pay} disabled={!valid} accessibilityRole="button"
            style={{ backgroundColor: C.navy2, height: 42, borderRadius: 9, marginTop: 10, justifyContent: 'center', alignItems: 'center', opacity: valid ? 1 : 0.5 }}>
            <Text style={{ color: C.white, fontWeight: '700' }}>Pay  {num(valid ? value : pending)}</Text>
            <View style={{ position: 'absolute', right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: C.navy3, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="chevron-right" size={16} color={C.white} />
            </View>
          </Pressable>
        </View>

        {q.loading ? <Loading /> : (
          <>
            {!!q.error && <Empty text={q.error} error />}
            {!q.error && fees.length === 0 && <Empty text="No fees have been assigned to you." />}
            {fees.map((x: any) => {
              const f = x.fee_structures || {};
              const paid = x.status === 'paid';
              return (
                <View key={x.id} style={{ backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 3, opacity: x.status === 'cancelled' ? 0.5 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name={paid ? 'check-square' : 'square'} size={18} color={C.text} accessibilityLabel={paid ? 'Paid' : 'Not paid'} />
                    <Text style={{ flex: 1, fontSize: 16, marginLeft: 10, color: C.text }}>{f.title || `${x.fee_type || f.fee_type || 'Fee'} fee`}</Text>
                    <Text style={{ fontSize: 22, color: C.text }}>{num(feeAmount(x))}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingLeft: 28 }}>
                    <Text style={{ color: C.text }}>{String(x.fee_type || f.fee_type || 'Fee').replace(/^./, (letter: string) => letter.toUpperCase())}</Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>Academic year · {x.academic_year || f.academic_year}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingLeft: 28 }}>
                    <Text style={{ color: C.text }}>Due</Text>
                    <Text style={{ fontSize: 11, color: x.status === 'overdue' ? C.danger : C.muted }}>
                      {dateText(x.due_date)}{x.status !== 'pending' && x.status !== 'paid' ? `  (${x.status})` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Scroll>

      <Sheet visible={showReceipts} title="Receipts" onClose={() => setShowReceipts(false)}>
        {payments.length === 0 && <Empty text="No payments yet." />}
        {payments.map((p: any) => (
          <View key={p.id} style={{ backgroundColor: C.surface, borderRadius: 12, padding: 14, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontWeight: '500' }}>{money(p.amount)}</Text>
              <Text style={{ textTransform: 'capitalize', color: p.status === 'success' ? C.teal : C.muted }}>{p.status}</Text>
            </View>
            <Text style={{ color: C.muted, marginTop: 4 }}>{dateText(p.paid_at || p.created_at)} · {p.payment_method || '-'}</Text>
            {!!p.reference && <Text style={{ color: C.muted, marginTop: 2, fontSize: 12 }}>Ref: {p.reference}</Text>}
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}
