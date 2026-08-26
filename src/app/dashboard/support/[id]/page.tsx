import { SupportDetailsView } from "@/components/support/support-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupportDetailsPage({ params }: Props) {
  const { id } = await params;
  return <SupportDetailsView id={id} />;
}
