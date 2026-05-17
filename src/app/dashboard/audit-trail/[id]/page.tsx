import { AuditTrailDetailsView } from "@/components/audit-trail/audit-trail-details-view";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function AuditTrailDetailsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { type } = await searchParams;
  const subjectType = type === "customers" ? "customers" : "internal";

  return <AuditTrailDetailsView key={`${subjectType}-${id}`} subjectId={id} subjectType={subjectType} />;
}
