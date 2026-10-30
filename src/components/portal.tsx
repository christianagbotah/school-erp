'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import AnalyticsView from '@/components/views/analytics-view';
import ReportCardsView from '@/components/views/report-cards-view';
import PayrollView from '@/components/views/payroll-view';
import DebtorsView from '@/components/views/debtors-view';
import FinancialReportsView from '@/components/views/financial-reports-view';
import TimetableView from '@/components/views/timetable-view';
import AnnouncementsView from '@/components/views/announcements-view';
import type { ViewKey } from '@/components/command-palette';

const NAV: Record<ViewKey, { label: string; roles: string[] }> = {
  dashboard: { label: 'Overview', roles: ['*'] },
  analytics: { label: 'Analytics', roles: ['headteacher', 'academic_head', 'proprietor', 'bursar', 'accountant'] },
  attendance: { label: 'Attendance', roles: ['teacher', 'class_teacher', 'academic_head', 'headteacher'] },
  marks: { label: 'SBA Gradebook', roles: ['teacher', 'class_teacher', 'academic_head', 'headteacher'] },
  reports: { label: 'Report Cards', roles: ['teacher', 'class_teacher', 'academic_head', 'headteacher', 'proprietor', 'bursar', 'parent', 'student'] },
  timetable: { label: 'Timetable', roles: ['*'] },
  students: { label: 'Students', roles: ['headteacher', 'academic_head', 'proprietor', 'teacher', 'class_teacher', 'accountant'] },
  fees: { label: 'Fees & Invoices', roles: ['accountant', 'bursar', 'headteacher', 'proprietor', 'cashier', 'parent', 'student'] },
  cashier: { label: 'Collections', roles: ['cashier', 'accountant', 'bursar', 'headteacher'] },
  debtors: { label: 'Debtors', roles: ['bursar', 'accountant', 'headteacher', 'proprietor', 'cashier'] },
  payroll: { label: 'Payroll', roles: ['bursar', 'accountant', 'headteacher', 'proprietor'] },
  financials: { label: 'Financial Reports', roles: ['bursar', 'accountant', 'headteacher', 'proprietor'] },
  notices: { label: 'Notices', roles: ['*'] },
  sync: { label: 'Sync Console', roles: ['*'] },
};

const VIEWS: Record<ViewKey, React.ComponentType> = {
  dashboard: DashboardView,
  analytics: AnalyticsView,
  attendance: AttendanceView,
  marks: MarksView,
  reports: ReportCardsView,
  timetable: TimetableView,
  students: StudentsView,
  fees: FeesView,
  cashier: CashierView,
  debtors: DebtorsView,
  financials: FinancialReportsView,
  payroll: PayrollView,
  notices: AnnouncementsView,
  sync: SyncConsoleView,
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
  const currentView = availableViews.includes(view) ? view : 'dashboard';
  const View = VIEWS[currentView];

  return (
    <AppShell view={currentView} setView={setView} availableViews={availableViews}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <View />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
