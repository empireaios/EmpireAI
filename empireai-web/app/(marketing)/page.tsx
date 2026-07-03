import { redirect } from "next/navigation";

/** V1 Activation — no public landing page; middleware also routes unauthenticated `/` to login. */
export default function RootPage() {
  redirect("/login");
}
