import { CustomerDetailsView } from "@/components/user-mgt/customers-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailsPage({ params }: Props) {
  const { id } = await params;
  return <CustomerDetailsView id={id} />;
}
