// Old /admin route is disabled (page.tsx returns 404). The dashboard lives at
// the secret URL. Components and admin.css in this folder are still used there.
export default function OldAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
