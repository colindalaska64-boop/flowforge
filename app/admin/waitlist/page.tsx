import { redirect } from "next/navigation";

// Waitlist supprimée — redirection vers l'admin
export default function AdminWaitlistPage() {
  redirect("/admin");
}
