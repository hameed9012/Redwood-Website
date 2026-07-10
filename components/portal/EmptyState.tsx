/** Shown by a portal section while its data is empty. Populate the matching
 *  array in lib/portal/* and the real UI takes over automatically. */
export function EmptyState({ note = 'Nothing here yet.' }: { note?: string }) {
  return (
    <p className="mt-2 rounded-lg border border-dashed border-rw-charcoal px-6 py-16 text-center text-sm text-rw-bone/40">
      {note}
    </p>
  );
}
