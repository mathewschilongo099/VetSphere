import { notFound } from 'next/navigation';

// The dashboard moved to a secret URL. This old route only returns 404.
export default function OldAdminRoute() {
  notFound();
}
