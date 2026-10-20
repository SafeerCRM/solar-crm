import { redirect, notFound } from 'next/navigation';

import {
  getCustomerSmartLinkDestination,
} from '@/lib/customerSmartLinks';

export default async function CustomerSmartLinkPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const destination =
    getCustomerSmartLinkDestination(type);

  if (!destination) {
    notFound();
  }

  redirect(destination);
}