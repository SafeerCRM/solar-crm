import { notFound } from 'next/navigation';
import CustomerSmartLinkFallback from '@/components/CustomerSmartLinkFallback';
import { getCustomerSmartLinkDestination } from '@/lib/customerSmartLinks';

export default async function CustomerSmartLinkPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const destination = getCustomerSmartLinkDestination(type);

  if (!destination) {
    notFound();
  }

  return <CustomerSmartLinkFallback destination={destination} />;
}