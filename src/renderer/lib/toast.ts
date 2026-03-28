import { toast } from 'sonner';

export function showError(message: string): void {
  toast.error(message, { duration: 4000 });
}

export function showSuccess(message: string): void {
  toast.success(message, { duration: 2000 });
}

export function showInfo(message: string): void {
  toast.info(message, { duration: 3000 });
}
