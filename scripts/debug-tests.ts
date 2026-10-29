const BASE = 'http://localhost:3000';
async function main() {
  // 1. invalid login status code
  const bad = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'head@lightworld.edu.gh', password: 'wrongpass' }) });
  console.log('bad login status:', bad.status);

  // 2. parent scoping
  const pres = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'parent@lightworld.edu.gh', password: 'Demo1234!' }) });
  const pcookie = pres.headers.get('set-cookie')?.split(';')[0];
  const inv = await fetch(`${BASE}/api/fees/invoices?pageSize=50`, { headers: { Cookie: pcookie ?? '' } }).then((r) => r.json());
  console.log('parent invoice students:', inv.invoices?.map((i) => i.student.name));
  const search = await fetch(`${BASE}/api/search?q=Mensah`, { headers: { Cookie: pcookie ?? '' } }).then((r) => r.json());
  console.log('parent search results:', search.students?.map((s) => s.name));

  // 3. idempotency debug — cashier
  const cres = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cashier@lightworld.edu.gh', password: 'Demo1234!' }) });
  const ccookie = cres.headers.get('set-cookie')?.split(';')[0];
  const classes = await fetch(`${BASE}/api/classes`, { headers: { Cookie: ccookie ?? '' } }).then((r) => r.json());
  const cls = classes.classes[0];
  const roster = await fetch(`${BASE}/api/attendance?classId=${cls.id}&date=2026-11-05`, { headers: { Cookie: ccookie ?? '' } }).then((r) => r.json());
  console.log('roster students:', roster.roster?.length, '| first:', roster.roster?.[0]?.studentId);
  const body = JSON.stringify({
    deviceId: 'TEST-ISO',
    operations: [{ id: `test-idem-${Date.now()}`, entityType: 'payment', opType: 'create', payload: { studentId: roster.roster[0].studentId, method: 'cash', amount: 1000, offlineReceiptNo: `OFF-DBG-${Date.now()}` } }],
  });
  const push1 = await fetch(`${BASE}/api/sync/push`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ccookie ?? '' }, body }).then((r) => r.json());
  console.log('push1 result:', JSON.stringify(push1.results[0]));
}
main();
