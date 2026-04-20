import { EtradeTransactionDetailView } from "@/components/e-trades/etrade-transaction-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EtradeTransactionDetailPage({ params }: Props) {
  const { id } = await params;
  return <EtradeTransactionDetailView transactionId={id} />;
}
