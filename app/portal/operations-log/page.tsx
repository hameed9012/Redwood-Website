import { PortalShell } from '@/components/portal/PortalShell';
import { loadOperationsLog } from '@/lib/portal/operationsLog';
import { OperationsLogView } from './OperationsLogView';

export const dynamic = 'force-dynamic';

export default async function OperationsLogPage() {
  const rows = await loadOperationsLog();
  return (
    <PortalShell required="employee" title="Operations Log">
      <OperationsLogView rows={rows} />
    </PortalShell>
  );
}
