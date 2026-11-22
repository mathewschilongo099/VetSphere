import type { Metadata } from 'next';
import '@/app/admin/admin.css';

export const metadata: Metadata = {
  title: 'Admin | VetSphere',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="neu-admin">
      <span aria-hidden="true" className="neu-circle c1" />
      <span aria-hidden="true" className="neu-circle c2" />
      <span aria-hidden="true" className="neu-circle c3" />
      <div className="neu-content">{children}</div>
    </div>
  );
}
