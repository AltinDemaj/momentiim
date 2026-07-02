import { redirect } from 'next/navigation';

/** Legacy route — create room experience lives at /admin/rooms/new */
export default function LegacyNewEventPage() {
  redirect('/admin/rooms/new');
}
