import { RequireTier } from '@/components/auth/RequireTier';
import { loadPersonnel } from '@/lib/portal/personnel';
import { PersonnelView } from './PersonnelView';

export const dynamic = 'force-dynamic';

export default async function PersonnelPage() {
  const groups = await loadPersonnel();
  return (
    <RequireTier required="employee">
      <PersonnelView groups={groups} />
    </RequireTier>
  );
}
