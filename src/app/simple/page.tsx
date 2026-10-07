import type { Metadata } from "next";
import { person } from "@/knowledge/profile";
import { SimpleView } from "@/simple/SimpleView";

export const metadata: Metadata = {
  title: "Simple view",
  description: `${person.name}'s projects, research, experience and skills as one plain page.`,
  alternates: { canonical: "/simple" },
};

export default function SimplePage() {
  return <SimpleView />;
}
