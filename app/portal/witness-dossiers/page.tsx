import { RequireTier } from '@/components/auth/RequireTier';
import { loadWitnessDossiers } from '@/lib/portal/witnessDossiers';
import { WitnessDossiersView } from './WitnessDossiersView';

export const dynamic = 'force-dynamic';

export default async function WitnessDossiersPage() {
  const { dossiers, reports } = await loadWitnessDossiers();
  return (
    <RequireTier required="high-command">
      <WitnessDossiersView dossiers={dossiers} reports={reports} />
    </RequireTier>
  );
}
