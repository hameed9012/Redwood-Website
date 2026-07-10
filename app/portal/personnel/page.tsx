import { PortalShell } from '@/components/portal/PortalShell';
import { loadPersonnel } from '@/lib/portal/personnel';
import { PersonnelView } from './PersonnelView';

export const dynamic = 'force-dynamic';

export default async function PersonnelPage() {
  const groups = await loadPersonnel();
  return (
    <PortalShell required="employee" title="Personnel">
      <PersonnelView groups={groups} />
    </PortalShell>
  );
}
