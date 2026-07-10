import { RequireTier } from '@/components/auth/RequireTier';
import { loadOperationsLog } from '@/lib/portal/operationsLog';
import { OperationsLogView } from './OperationsLogView';

export const dynamic = 'force-dynamic';

export default async function OperationsLogPage() {
  const rows = await loadOperationsLog();
  return (
    <RequireTier required="employee">
      <OperationsLogView rows={rows} />
    </RequireTier>
  );
}
