import { ProductDetailsView } from "@/components/product-mgt/product-details-view";

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetailsView id={id} />;
}
