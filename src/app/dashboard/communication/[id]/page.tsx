import { CommunicationDetailsView } from "@/components/communication/communication-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CommunicationDetailsPage({ params }: Props) {
  const { id } = await params;
  return <CommunicationDetailsView id={id} />;
}
