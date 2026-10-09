import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@9';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
if (!serviceKey) throw new Error('Missing service role key');
const admin = createClient(url, serviceKey);

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return json({ error: 'Login required' }, 401);
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return json({ error: 'Invalid session' }, 401);

    const { data: adminRow } = await admin.from('admin').select('*').eq('id', auth.user.id).maybeSingle();
    const { data: staffRow } = await admin.from('staff').select('*').eq('id', auth.user.id).maybeSingle();
    if (!adminRow && !staffRow) return json({ error: 'Only admin or staff can use this function' }, 403);

    const body = await req.json();
    const action = body.action;

    if (action === 'create_student') {
      if (!staffRow && !adminRow) return json({ error: 'Staff or admin only' }, 403);
      if (staffRow && body.department !== staffRow.department) return json({ error: 'You can only create students in your department' }, 403);
      const { email, password, full_name, department, course, division, semester, phone } = body;
      if (!email || !password || !full_name || !department || !course || !division || !semester) return json({ error: 'Missing student fields' }, 400);
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !created.user) return json({ error: error?.message || 'Could not create account' }, 400);
      const { data: student, error: dbError } = await admin.from('students').insert({ id: created.user.id, email, full_name, department, course, division, semester: Number(semester), phone, created_by: auth.user.id }).select().single();
      if (dbError) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: dbError.message }, 400); }
      return json({ student });
    }

    if (action === 'delete_student') {
      const { student_id } = body;
      const { data: student } = await admin.from('students').select('*').eq('id', student_id).single();
      if (!student) return json({ error: 'Student not found' }, 404);
      if (staffRow && student.department !== staffRow.department) return json({ error: 'Not your department' }, 403);
      const { error } = await admin.auth.admin.deleteUser(student_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === 'delete_staff') {
      if (!adminRow) return json({ error: 'Admin only' }, 403);
      const { staff_id } = body;
      const { error } = await admin.auth.admin.deleteUser(staff_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === 'create_staff') {
      if (!adminRow) return json({ error: 'Admin only' }, 403);

      const { email, password, username, department, phone } = body;

      if (!email || !password || !username || !department) {
        return json({ error: 'Missing staff fields' }, 400);
      }

      // 1. Create the Supabase Auth account
      const { data: created, error } =
        await admin.auth.admin.createUser({
          email: email.trim(),
          password,
          email_confirm: true,
        });

      if (error || !created.user) {
        return json(
          { error: error?.message || 'Could not create account' },
          400
        );
      }

      // 2. Create the staff database row
      const { data: staff, error: dbError } =
        await admin
          .from('staff')
          .insert({
            id: created.user.id,
            email: email.trim(),
            username: username.trim(),
            department,
            phone: phone || null,
          })
          .select()
          .single();

      if (dbError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: dbError.message }, 400);
      }

      // 3. Send the login details to the staff member
      try {
        await sendStaffLoginEmail({
          email: email.trim(),
          username: username.trim(),
          password,
          department,
        });
      } catch (emailError) {
        console.error('Staff email error:', emailError);

        // Do not leave an account that the staff member cannot receive
        // the login details for. Remove both records.
        await admin.from('staff').delete().eq('id', created.user.id);
        await admin.auth.admin.deleteUser(created.user.id);

        return json(
          {
            error:
              emailError instanceof Error
                ? `Staff account was not created because the email could not be sent: ${emailError.message}`
                : 'Staff account was not created because the email could not be sent.',
          },
          500
        );
      }

      return json({
        staff,
        email_sent: true,
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Server error' }, 500); }
});

async function sendStaffLoginEmail({
  email,
  username,
  password,
  department,
}: {
  email: string;
  username: string;
  password: string;
  department: string;
}) {
  const smtpUser = Deno.env.get('SMTP_USERNAME');
  const smtpPassword = Deno.env.get('SMTP_PASSWORD');
  const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;
  const smtpHost = Deno.env.get('SMTP_HOSTNAME') || 'smtp.gmail.com';
  const smtpPort = Number(Deno.env.get('SMTP_PORT') || '465');
  const smtpSecure = (Deno.env.get('SMTP_SECURE') || 'true') === 'true';

  if (!smtpUser || !smtpPassword || !smtpFrom) {
    throw new Error(
      'Email is not configured. Add SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM to Supabase secrets.'
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const appName = Deno.env.get('APP_NAME') || 'UniCamp';
  const loginUrl = Deno.env.get('APP_LOGIN_URL') || '';

  const text = [
    `Welcome to ${appName}!`,
    '',
    `Hello ${username},`,
    '',
    'Your staff account has been created by the administrator.',
    '',
    `Email: ${email}`,
    `Password: ${password}`,
    `Department: ${department}`,
    loginUrl ? `Login: ${loginUrl}` : '',
    '',
    'Please keep these login details private.',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2>${escapeHtml(appName)} Staff Account</h2>
      <p>Hello ${escapeHtml(username)},</p>
      <p>Your staff account has been created by the administrator.</p>
      <div style="background:#f2f2f2;padding:16px;border-radius:10px">
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Password:</strong> ${escapeHtml(password)}</p>
        <p><strong>Department:</strong> ${escapeHtml(department)}</p>
      </div>
      ${loginUrl ? `<p><a href="${escapeHtml(loginUrl)}">Open UniCamp</a></p>` : ''}
      <p>Please keep these login details private.</p>
    </div>
  `;

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: `${appName} - Your Staff Login Details`,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
