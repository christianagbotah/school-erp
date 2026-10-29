'use client';

import { useState } from 'react';
import { useApp } from '@/components/app-provider';
import LoginPage from '@/components/login-page';
import { AppShell } from '@/components/app-shell';
import DashboardView from '@/components/views/dashboard-view';
import AttendanceView from '@/components/views/attendance-view';
import MarksView from '@/components/views/marks-view';
import FeesView from '@/components/views/fees-view';
import CashierView from '@/components/views/cashier-view';
import StudentsView from '@/components/views/students-view';
import SyncConsoleView from '@/components/views/sync-console-view';

export type ViewKey = 'dashboard' | 'attendance' | 'marks' | 'fees' | 'cashier' | 'students' | 'sync';

const NAV: Record<ViewKey, { label: string; roles: string[]; icon: string }> = {
  dashboard: { label: 'Overview', roles: ['*'], icon: 'home' },
  attendance: { label: 'Attendance', roles: ['teacher', 'class_teacher', 'academic_head', 'headteacher'], icon: 'check' },
  marks: { label: 'SBA Gradebook', roles: ['teacher', 'class_teacher', 'academic_head', 'headteacher'], icon: 'book' },
  fees: { label: 'Fees & Invoices', roles: ['accountant', 'bursar', 'headteacher', 'proprietor', 'cashier', 'parent', 'student'], icon: 'wallet' },
  cashier: { label: 'Collections', roles: ['cashier', 'accountant', 'bursar', 'headteacher'], icon: 'coins' },
  students: { label: 'Students', roles: ['headteacher', 'academic_head', 'proprietor', 'teacher', 'class_teacher', 'accountant'], icon: 'users' },
  sync: { label: 'Sync Console', roles: ['*'], icon: 'refresh' },
};

export function Portal() {
  const { me, loading } = useApp();
  const [view, setView] = useState<ViewKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!me) return <LoginPage />;

  const userRoles = me.roles.length > 0 ? me.roles : [];
  const canSee = (key: ViewKey) => NAV[key].roles.includes('*') || userRoles.some((r) => NAV[key].roles.includes(r));
  const availableViews = (Object.keys(NAV) as ViewKey[]).filter(canSee);

  return (
    <AppShell view={view} setView={setView} availableViews={availableViews}>
      {view === 'dashboard' && <DashboardView />}
      {view === 'attendance' && <AttendanceView />}
      {view === 'marks' && <MarksView />}
      {view === 'fees' && <FeesView />}
      {view === 'cashier' && <CashierView />}
      {view === 'students' && <StudentsView />}
      {view === 'sync' && <SyncConsoleView />}
    </AppShell>
  );
}
