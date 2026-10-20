export const CUSTOMER_SMART_LINK_DESTINATIONS = {
  payment: '/customer-portal/payments',
  project: '/customer-portal/project-tracker',
  insurance: '/customer-portal/insurance',
  service: '/customer-portal/after-sales-services',
  cleaning: '/customer-portal/cleaning-calendar',
  documents: '/customer-portal/documents',
  notifications: '/customer-portal/notifications',
  work: '/customer-portal/work-calendar',
} as const;

export type CustomerSmartLinkType =
  keyof typeof CUSTOMER_SMART_LINK_DESTINATIONS;

export function getCustomerSmartLinkDestination(
  type: string,
): string | null {
  if (
    !Object.prototype.hasOwnProperty.call(
      CUSTOMER_SMART_LINK_DESTINATIONS,
      type,
    )
  ) {
    return null;
  }

  return CUSTOMER_SMART_LINK_DESTINATIONS[
    type as CustomerSmartLinkType
  ];
}

export function getCustomerLoginLink(
  destination: string,
): string {
  return (
    '/customer-login?next=' +
    encodeURIComponent(destination)
  );
}