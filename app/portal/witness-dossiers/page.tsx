import { PortalShell } from '@/components/portal/PortalShell';
import { loadWitnessDossiers } from '@/lib/portal/witnessDossiers';
import { WitnessDossiersView } from './WitnessDossiersView';

export const dynamic = 'force-dynamic';

export default async function WitnessDossiersPage() {
  const { dossiers, reports } = await loadWitnessDossiers();
  return (
    <PortalShell required="high-command" title="Witness Dossiers">
      <WitnessDossiersView dossiers={dossiers} reports={reports} />
    </PortalShell>
  );
}
