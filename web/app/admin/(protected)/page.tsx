import { redirect } from 'next/navigation';

/** Legacy `/admin` route — rooms dashboard lives at `/admin/rooms`. */
export default function AdminIndexPage() {
  redirect('/admin/rooms');
}
