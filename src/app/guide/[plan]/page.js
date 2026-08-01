import { notFound } from "next/navigation";
import { plans } from "../../../data/plans";
import PlanGuide from "../../../components/PlanGuide";

export function generateStaticParams() {
  return Object.keys(plans).map((plan) => ({ plan }));
}

export default async function PlanPage({ params }) {
  const { plan: planSlug } = await params;
  const plan = plans[planSlug];
  if (!plan) notFound();
  return <PlanGuide plan={plan} />;
}
