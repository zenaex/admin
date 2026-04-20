import { EtradeChatroomView } from "@/components/e-trades/etrade-chatroom-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EtradeChatroomPage({ params }: Props) {
  const { id } = await params;
  return <EtradeChatroomView requestId={id} />;
}
