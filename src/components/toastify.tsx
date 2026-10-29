'use client';

import { toast } from 'sonner';

// Thin wrapper so views don't import sonner directly with different configs
export const ToastIfy = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
  warning: (msg: string) => toast.warning(msg),
};
