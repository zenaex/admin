"use client";

import Script from "next/script";

export default function ZohoSalesIQ() {
  const widgetCode = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_ID;

  if (!widgetCode) return null;

  return (
    <>
      <Script id="zoho-salesiq-init" strategy="afterInteractive">
        {`
          window.$zoho=window.$zoho || {};
          $zoho.salesiq=$zoho.salesiq||{ready:function(){}};
          $zoho.salesiq.ready = function() {
            $zoho.salesiq.appearance.color("#15803d"); // Dark Green
            $zoho.salesiq.appearance.theme("modern");
          };
        `}
      </Script>
      <Script
        id="zsiqscript"
        src={`https://salesiq.zohopublic.com/widget?wc=${widgetCode}`}
        strategy="afterInteractive"
        defer
      />
    </>
  );
}
