import { PortalShell } from '@/components/portal/PortalShell';
import { DIRECTIVES } from '@/lib/portal/highCommand';
import { loadLedger } from '@/lib/portal/command';
import { CommandView } from './CommandView';

export const dynamic = 'force-dynamic';

export default async function CommandPage() {
  const ledger = await loadLedger();
  return (
    <PortalShell required="high-command" title="Command">
      <CommandView directives={DIRECTIVES} ledger={ledger} />
    </PortalShell>
  );
}
