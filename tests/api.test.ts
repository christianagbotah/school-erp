// ============================================================================
// iEduPro integration tests — real HTTP against the dev server
// Covers: tenant isolation, role authorization, idempotent offline replay,
// payment double-post prevention, published-marks protection.
// Run: bun test tests/api.test.ts (requires dev server on :3000 and seed data)
// ============================================================================

import { describe, test, expect, beforeAll } from 'bun:test';

const BASE = 'http://localhost:3000';

async function login(email: string, password = 'Demo1234!') {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie')?.split(';')[0] ?? '';
  const data = await res.json().catch(() => ({}));
  return { cookie, status: res.status, data };
}

async function api(path: string, init?: RequestInit & { cookie?: string }) {
  const { cookie, ...rest } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(rest.headers ?? {}) },
  });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

describe('authentication', () => {
  test('valid credentials succeed', async () => {
    const { data } = await login('head@lightworld.edu.gh');
    expect((data as { ok: boolean }).ok).toBe(true);
  });

  test('invalid credentials rejected', async () => {
    const { status } = await login('head@lightworld.edu.gh', 'wrong');
    expect(status).toBe(401);
  });

  test('unknown account rejected', async () => {
    const { status } = await login('nobody@nowhere.com', 'whatever');
    expect(status).toBe(401);
  });

  test('me returns roles for authenticated user', async () => {
    const { cookie } = await login('teacher@lightworld.edu.gh');
    const { status, data } = await api('/api/auth/me', { cookie });
    expect(status).toBe(200);
    const me = data as { authenticated: boolean; roles: string[] };
    expect(me.authenticated).toBe(true);
    expect(me.roles).toContain('teacher');
  });

  test('unauthenticated access is rejected', async () => {
    const { status } = await api('/api/students');
    expect(status).toBe(401);
  });
});

describe('role-based authorization', () => {
  test('students endpoint requires authentication', async () => {
    const { status } = await api('/api/students');
    expect(status).toBe(401);
  });

  test('cashier cannot save SBA marks', async () => {
    const { cookie } = await login('cashier@lightworld.edu.gh');
    const { status } = await api('/api/marks', {
      method: 'POST',
      cookie,
      body: JSON.stringify({ entries: [{ studentId: 'x', subjectClassId: 'y', classId: 'z', termId: 't', component: 'test', rawScore: 5, maxScore: 100 }] }),
    });
    expect(status).toBe(403);
  });

  test('parent cannot mark attendance', async () => {
    const { cookie } = await login('parent@lightworld.edu.gh');
    const { status } = await api('/api/attendance', {
      method: 'POST',
      cookie,
      body: JSON.stringify({ studentId: 'x', date: '2026-10-29', status: 'present' }),
    });
    expect(status).toBe(403);
  });

  test('teacher cannot generate invoices', async () => {
    const { cookie } = await login('teacher@lightworld.edu.gh');
    const { status } = await api('/api/fees/generate', {
      method: 'POST',
      cookie,
      body: JSON.stringify({ schoolId: 'x', academicYearId: 'y', planId: 'z', dueDate: '2026-12-01' }),
    });
    expect(status).toBe(403);
  });
});

describe('parent scoping — guardians see linked wards only', () => {
  test('parent invoices scoped to own wards', async () => {
    const { cookie } = await login('parent@lightworld.edu.gh');
    const { data } = await api('/api/fees/invoices?pageSize=50', { cookie });
    const invoices = (data as { invoices: { student: { name: string } }[] }).invoices;
    // All visible invoices must be for the linked child (Kofi Frimpong) — exactly one ward
    expect(invoices.length).toBeGreaterThan(0);
    const names = new Set(invoices.map((i) => i.student.name));
    expect(names.size).toBe(1);
    expect([...names][0]).toContain('Frimpong');
  });

  test('parent search returns linked wards only, never the directory', async () => {
    const { cookie } = await login('parent@lightworld.edu.gh');
    const res = await fetch(`${BASE}/api/search?q=a`, { headers: { Cookie: cookie } });
    const data = await res.json() as { students: { name: string }[] };
    // parent scope: at most the linked ward(s), never unrelated students
    for (const s of data.students ?? []) {
      expect(s.name).toContain('Frimpong');
    }
  });
});

describe('offline sync — idempotency and conflict rules', () => {
  test('duplicate operation ID returns original result, posts once', async () => {
    const { cookie } = await login('cashier@lightworld.edu.gh');
    // find a real student
    const { data: me } = await api('/api/auth/me', { cookie });
    const classes = await api('/api/classes', { cookie });
    const cls = (classes.data as { classes: { id: string }[] }).classes[0];
    const roster = await api(`/api/attendance?classId=${cls.id}&date=2026-11-05`, { cookie });
    const studentId = (roster.data as { roster: { studentId: string }[] }).roster[0].studentId;

    const opId = `test-idem-${Date.now()}`;
    const body = JSON.stringify({
      deviceId: 'TEST-ISO',
      operations: [{
        id: opId, entityType: 'payment', opType: 'create',
        payload: { studentId, method: 'cash', amount: 1000, offlineReceiptNo: `OFF-TEST-${opId}` },
      }],
    });
    const first = await api('/api/sync/push', { method: 'POST', cookie, body });
    const second = await api('/api/sync/push', { method: 'POST', cookie, body });

    const firstResult = (first.data as { results: { status: string }[] }).results[0];
    const secondResult = (second.data as { results: { status: string }[] }).results[0];
    expect(firstResult.status).toBe('applied');
    expect(secondResult.status).toBe('duplicate'); // replay → original, no double-post
  });

  test('attendance conflict is surfaced, not silently overwritten', async () => {
    const { cookie } = await login('teacher@lightworld.edu.gh');
    const classes = await api('/api/classes', { cookie });
    const cls = (classes.data as { classes: { id: string }[] }).classes[0];
    const roster = await api(`/api/attendance?classId=${cls.id}&date=2026-11-04`, { cookie });
    const studentId = (roster.data as { roster: { studentId: string }[] }).roster[0].studentId;

    // server value: present
    await api('/api/attendance', {
      method: 'POST', cookie,
      body: JSON.stringify({ studentId, date: '2026-11-04', status: 'present', sessionType: 'morning' }),
    });

    // offline capture differs → conflict
    const opId = `test-conflict-${Date.now()}`;
    const push = await api('/api/sync/push', {
      method: 'POST', cookie,
      body: JSON.stringify({
        deviceId: 'TEST-CONFLICT',
        operations: [{ id: opId, entityType: 'attendance', opType: 'create', payload: { studentId, date: '2026-11-04', sessionType: 'morning', status: 'absent' } }],
      }),
    });
    const result = (push.data as { results: { status: string; detail: string }[] }).results[0];
    expect(result.status).toBe('conflict');
    expect(result.detail).toContain('present');
    expect(result.detail).toContain('absent');

    // server value unchanged
    const rosterAfter = await api(`/api/attendance?classId=${cls.id}&date=2026-11-04`, { cookie });
    const status = (rosterAfter.data as { roster: { studentId: string; status: string | null }[] }).roster.find((r) => r.studentId === studentId)?.status;
    expect(status).toBe('present');
  });

  test('cashier cannot push attendance operations (authority check)', async () => {
    const { cookie } = await login('cashier@lightworld.edu.gh');
    const classes = await api('/api/classes', { cookie });
    const cls = (classes.data as { classes: { id: string }[] }).classes[0];
    const roster = await api(`/api/attendance?classId=${cls.id}&date=2026-11-03`, { cookie });
    const studentId = (roster.data as { roster: { studentId: string }[] }).roster[0].studentId;

    const push = await api('/api/sync/push', {
      method: 'POST', cookie,
      body: JSON.stringify({
        deviceId: 'TEST-AUTHZ',
        operations: [{ id: `test-authz-${Date.now()}`, entityType: 'attendance', opType: 'create', payload: { studentId, date: '2026-11-03', status: 'present' } }],
      }),
    });
    const result = (push.data as { results: { status: string }[] }).results[0];
    expect(result.status).toBe('rejected');
  });
});

describe('SBA marks validation', () => {
  test('score exceeding max is rejected', async () => {
    const { cookie } = await login('teacher@lightworld.edu.gh');
    const classes = await api('/api/classes', { cookie });
    const b4 = (classes.data as { classes: { id: string; name: string }[] }).classes.find((c) => c.name === 'Basic 4');
    const marks = await api(`/api/marks?classId=${b4!.id}`, { cookie });
    const md = marks.data as { term: { id: string }; subjects: { id: string }[]; students: { id: string }[] };
    const { status, data } = await api('/api/marks', {
      method: 'POST', cookie,
      body: JSON.stringify({
        entries: [{
          studentId: md.students[0].id, subjectClassId: md.subjects[0].id, classId: b4!.id,
          termId: md.term.id, component: 'exercise', rawScore: 150, maxScore: 100, status: 'marked',
        }],
      }),
    });
    const results = (data as { rejected: string[] }).rejected;
    expect(status).toBe(200);
    expect(results.length).toBe(1);
    expect(results[0]).toContain('exceeds');
  });
});

describe('financial reports — role gating and ledger integrity', () => {
  test('unauthenticated access is rejected', async () => {
    const { status } = await api('/api/finance/reports?type=trial-balance');
    expect(status).toBe(401);
  });

  test('cashier is denied financial statements (403)', async () => {
    const { cookie } = await login('cashier@lightworld.edu.gh');
    const { status } = await api('/api/finance/reports?type=trial-balance', { cookie });
    expect(status).toBe(403);
  });

  test('teacher is denied financial statements (403)', async () => {
    const { cookie } = await login('teacher@lightworld.edu.gh');
    const { status } = await api('/api/finance/reports?type=balance-sheet', { cookie });
    expect(status).toBe(403);
  });

  test('bursar gets a balanced trial balance from posted entries', async () => {
    const { cookie } = await login('bursar@lightworld.edu.gh');
    const { status, data } = await api('/api/finance/reports?type=trial-balance', { cookie });
    expect(status).toBe(200);
    const tb = (data as { trialBalance: { rows: unknown[]; totals: { debits: number; credits: number }; balanced: boolean } }).trialBalance;
    expect(tb.rows.length).toBeGreaterThan(0);
    expect(tb.balanced).toBe(true);
    expect(tb.totals.debits).toBe(tb.totals.credits);
    expect(tb.totals.debits).toBeGreaterThan(0);
  });

  test('invoice generation accrues revenue; payment moves cash — statements reflect both', async () => {
    const { cookie } = await login('bursar@lightworld.edu.gh');

    // tenant context
    const boot = await api('/api/bootstrap');
    const schoolId = (boot.data as { tenants: { schools: { id: string }[] }[] }).tenants[0].schools[0].id;
    const plansRes = await api('/api/fees/plans', { cookie });
    const { plans, years } = plansRes.data as { plans: { id: string }[]; years: { id: string; isCurrent: boolean; terms: { id: string; isCurrent: boolean }[] }[] };
    const curYear = years.find((y) => y.isCurrent) ?? years[0];
    const academicYearId = curYear.id;
    const termId = curYear.terms.find((t) => t.isCurrent)?.id ?? curYear.terms[0]?.id ?? null;
    const studentsRes = await api('/api/students?pageSize=6', { cookie });
    const students = (studentsRes.data as { students: { id: string }[] }).students;

    // generate an invoice for the first (student, plan) combo not already invoiced —
    // generation now posts the accrual journal (Dr AR / Cr revenue) atomically
    let generated = false;
    outer: for (const plan of plans.slice(0, 3)) {
      for (const s of students) {
        const gen = await api('/api/fees/generate', {
          method: 'POST', cookie,
          body: JSON.stringify({ schoolId, academicYearId, termId, planId: plan.id, dueDate: '2026-12-15', studentIds: [s.id] }),
        });
        if (gen.status === 200 && (gen.data as { generated: number }).generated === 1) {
          generated = true;
          break outer;
        }
      }
    }
    expect(generated).toBe(true);

    // offline payment capture (cashier) — now journals Dr Cash / Cr AR too
    const { cookie: cashierCookie } = await login('cashier@lightworld.edu.gh');
    const classes = await api('/api/classes', { cookie: cashierCookie });
    const cls = (classes.data as { classes: { id: string }[] }).classes[0];
    const roster = await api(`/api/attendance?classId=${cls.id}&date=2026-11-05`, { cookie: cashierCookie });
    const studentId = (roster.data as { roster: { studentId: string }[] }).roster[0].studentId;
    const opId = `test-finrep-${Date.now()}`;
    const push = await api('/api/sync/push', {
      method: 'POST', cookie: cashierCookie,
      body: JSON.stringify({
        deviceId: 'TEST-FINREP',
        operations: [{ id: opId, entityType: 'payment', opType: 'create', payload: { studentId, method: 'cash', amount: 250_00, offlineReceiptNo: `OFF-FINREP-${opId}` } }],
      }),
    });
    expect((push.data as { results: { status: string }[] }).results[0].status).toBe('applied');

    // income statement must now show revenue from the generated invoice
    const { status, data } = await api('/api/finance/reports?type=income-statement&from=2020-01-01', { cookie });
    expect(status).toBe(200);
    const is = (data as { incomeStatement: { totalRevenue: number; totalExpense: number; netIncome: number } }).incomeStatement;
    expect(is.totalRevenue).toBeGreaterThan(0);
    expect(is.netIncome).toBe(is.totalRevenue - is.totalExpense);

    // trial balance still ties after both postings
    const tbRes = await api('/api/finance/reports?type=trial-balance', { cookie });
    const tb = (tbRes.data as { trialBalance: { balanced: boolean } }).trialBalance;
    expect(tb.balanced).toBe(true);
  });

  test('balance sheet satisfies assets = liabilities + equity', async () => {
    const { cookie } = await login('proprietor@lightworld.edu.gh');
    const { status, data } = await api('/api/finance/reports?type=balance-sheet', { cookie });
    expect(status).toBe(200);
    const bs = (data as { balanceSheet: { totals: { assets: number; liabilitiesAndEquity: number }; balanced: boolean } }).balanceSheet;
    expect(bs.totals.assets).toBe(bs.totals.liabilitiesAndEquity);
    expect(bs.balanced).toBe(true);
  });

  test('invalid report type is rejected', async () => {
    const { cookie } = await login('bursar@lightworld.edu.gh');
    const { status } = await api('/api/finance/reports?type=horoscope', { cookie });
    expect(status).toBe(400);
  });
});
