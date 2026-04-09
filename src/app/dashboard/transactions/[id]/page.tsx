import { TransactionDetailsView } from "@/components/transactions/transaction-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailsPage({ params }: Props) {
  const { id } = await params;
  return <TransactionDetailsView id={id} />;
}
