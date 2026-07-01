import { AuthProvider } from "@/lib/auth/context";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthProvider>{children}</AuthProvider>;
}
