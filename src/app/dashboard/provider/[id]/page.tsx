import { ProviderDetailsView } from "@/components/provider/provider-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProviderDetailsPage({ params }: Props) {
  const { id } = await params;
  return <ProviderDetailsView id={id} />;
}
