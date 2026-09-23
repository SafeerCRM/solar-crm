"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import {
  App,
} from "@capacitor/app";

import {
  Browser,
} from "@capacitor/browser";

import {
  Capacitor,
} from "@capacitor/core";

export default function CustomerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    if (
      !Capacitor.isNativePlatform()
    ) {
      return;
    }

    const handleDeepLink = async (
      url: string,
    ) => {
      let parsedUrl: URL;

      try {
        parsedUrl =
          new URL(url);
      } catch {
        return;
      }

      if (
        parsedUrl.protocol !==
          "adityasolarscustomer:" ||
        parsedUrl.hostname !==
          "payment"
      ) {
        return;
      }

      let destination:
        | string
        | null = null;

      /*
       * Project installment payment.
       */
      if (
        parsedUrl.pathname ===
        "/project"
      ) {
        destination =
          "/customer-portal/payments";
      }

      /*
       * Reserved for the customer
       * insurance gateway flow.
       */
      if (
        parsedUrl.pathname ===
        "/insurance"
      ) {
        destination =
          "/customer-portal/insurance";
      }

      /*
       * Reserved for the customer
       * after-sales gateway flow.
       */
      if (
        parsedUrl.pathname ===
        "/after-sales"
      ) {
        destination =
          "/customer-portal/after-sales-services";
      }

      if (!destination) {
        return;
      }

      try {
        await Browser.close();
      } catch {
        // Browser may already be closed.
      }

      window.location.href =
        destination;
    };

    let removeListener:
      | (() => Promise<void>)
      | null = null;

    void App.addListener(
      "appUrlOpen",
      async ({
        url,
      }) => {
        await handleDeepLink(
          url,
        );
      },
    ).then(
      (listenerHandle) => {
        removeListener =
          () =>
            listenerHandle.remove();
      },
    );

    /*
     * Covers the case where Android
     * launches a fresh Customer App
     * instance from the payment link.
     */
    void App.getLaunchUrl().then(
      (result) => {
        if (result?.url) {
          void handleDeepLink(
            result.url,
          );
        }
      },
    );

    return () => {
      if (removeListener) {
        void removeListener();
      }
    };
  }, []);

  return <>{children}</>;
}