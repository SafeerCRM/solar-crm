"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const smartLinkRoutes: Record<string, string> = {
  "/open/payment": "/customer-portal/payments",
  "/open/project": "/customer-portal/project-tracker",
  "/open/insurance": "/customer-portal/insurance",
  "/open/service": "/customer-portal/after-sales-services",
  "/open/cleaning": "/customer-portal/cleaning-calendar",
  "/open/documents": "/customer-portal/documents",
  "/open/notifications": "/customer-portal/notifications",
  "/open/work": "/customer-portal/work-calendar",
};

const paymentCallbackRoutes: Record<string, string> = {
  "/project": "/customer-portal/payments",
  "/insurance": "/customer-portal/insurance",
  "/after-sales": "/customer-portal/after-sales-services",
  "/cleaning": "/customer-portal/cleaning-calendar",
};

export default function CustomerAppDeepLinkHandler() {
  useEffect(() => {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android"
  ) {
    return;
  }

      let lastHandledUrl = "";
    let lastHandledAt = 0;

    const shouldHandleUrl = (url: string) => {
      const now = Date.now();

      if (
        url === lastHandledUrl &&
        now - lastHandledAt < 5000
      ) {
        return false;
      }

      lastHandledUrl = url;
      lastHandledAt = now;

      return true;
    };

    const handleDeepLink = async (url: string) => {
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(url);
      } catch {
        return;
      }

            if (!shouldHandleUrl(url)) {
        return;
      }

      const isWhatsappSmartLink =
        parsedUrl.protocol === "https:" &&
        parsedUrl.hostname === "adityasolars.co.in";

      if (isWhatsappSmartLink) {
        const destination =
          smartLinkRoutes[parsedUrl.pathname];

        if (!destination) return;

        window.location.href = destination;
        return;
      }

      const isPaymentCallback =
        parsedUrl.protocol === "adityasolarscustomer:" &&
        parsedUrl.hostname === "payment";

      if (!isPaymentCallback) return;

      const destination =
        paymentCallbackRoutes[parsedUrl.pathname];

      if (!destination) return;

      try {
        await Browser.close();
      } catch {
        // Browser may already be closed.
      }

      window.location.href = destination;
    };

    let cancelled = false;

let listenerHandle: Awaited<
  ReturnType<typeof App.addListener>
> | null = null;

const initializeCustomerDeepLinks = async () => {
  try {
    const info = await App.getInfo();

    if (
      cancelled ||
      info.id !== "com.adityasolars.customer"
    ) {
      return;
    }

    const handle = await App.addListener(
      "appUrlOpen",
      ({ url }) => {
        void handleDeepLink(url);
      },
    );

    if (cancelled) {
      await handle.remove();
      return;
    }

    listenerHandle = handle;

    const launchResult = await App.getLaunchUrl();

    if (!cancelled && launchResult?.url) {
      await handleDeepLink(launchResult.url);
    }
  } catch (error) {
    console.error(
      "Customer App deep-link initialization failed:",
      error,
    );
  }
};

void initializeCustomerDeepLinks();

return () => {
  cancelled = true;

  if (listenerHandle) {
    void listenerHandle.remove();
  }
};
  }, []);

  return null;
}