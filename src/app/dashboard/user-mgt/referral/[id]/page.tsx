import { ReferralDetailsView } from "@/components/user-mgt/referral-details-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReferralDetailsPage({ params }: Props) {
  const { id } = await params;
  return <ReferralDetailsView id={id} />;
}
