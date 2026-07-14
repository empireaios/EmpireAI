import { redirect } from "next/navigation";

/** P8-02 — Commerce index routes to canonical Operating Model. */
export default function CommerceIndexPage() {
  redirect("/cockpit/commerce/operating");
}
