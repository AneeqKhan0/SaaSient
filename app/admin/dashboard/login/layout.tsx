export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  // This layout overrides the parent admin dashboard layout
  // to show only the login page without the sidebar
  return <>{children}</>;
}
