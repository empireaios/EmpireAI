import type { LiveStoreAnalytics } from "../models/live-store-config.js";

export type StorefrontPageInput = {
  storeSlug: string;
  productName: string;
  productDescription: string;
  priceCents: number;
  currency: string;
  checkoutUrl: string;
  analytics: LiveStoreAnalytics;
  storeBaseUrl: string;
};

function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

/** Builds analytics script block for GA4 and Meta Pixel. */
export function buildAnalyticsScripts(analytics: LiveStoreAnalytics): string {
  const lines: string[] = [];

  if (analytics.ga4MeasurementId && !analytics.ga4MeasurementId.includes("BLUEPRINT")) {
    lines.push(`
<script async src="https://www.googletagmanager.com/gtag/js?id=${analytics.ga4MeasurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${analytics.ga4MeasurementId}');
</script>`);
  }

  if (analytics.metaPixelId && !analytics.metaPixelId.includes("BLUEPRINT")) {
    lines.push(`
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${analytics.metaPixelId}');
  fbq('track', 'PageView');
</script>`);
  }

  if (analytics.tiktokPixelId && !analytics.tiktokPixelId.includes("BLUEPRINT")) {
    lines.push(`
<script>
  !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))};};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
  var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
  var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${analytics.tiktokPixelId}'); ttq.page();
}(window,document,'ttq');
</script>`);
  }

  return lines.join("\n");
}

/** Generates a minimal single-product storefront HTML with analytics and checkout CTA. */
export function buildStorefrontHtml(input: StorefrontPageInput): string {
  const price = formatPrice(input.priceCents, input.currency);
  const analyticsScripts = buildAnalyticsScripts(input.analytics);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${input.productName} — Grand King's Store</title>
  <meta name="description" content="${input.productDescription.replace(/"/g, "&quot;")}" />
  ${analyticsScripts}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f12; color: #f5f5f7; min-height: 100vh; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
    .badge { display: inline-block; background: #2d2d35; color: #a78bfa; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; }
    h1 { font-size: 2.25rem; line-height: 1.2; margin-bottom: 12px; }
    .price { font-size: 1.75rem; font-weight: 700; color: #34d399; margin: 20px 0; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 10px; font-size: 1rem; }
    .cta:hover { opacity: 0.92; }
    footer { margin-top: 48px; font-size: 12px; color: #52525b; }
  </style>
</head>
<body>
  <div class="wrap">
    <span class="badge">Grand King's Account — Live Store</span>
    <h1>${input.productName}</h1>
    <div class="price">${price}</div>
    <p>${input.productDescription}</p>
    <a class="cta" href="${input.checkoutUrl}" id="checkout-btn">Buy Now — Secure Checkout</a>
    <footer>Powered by EmpireAI · ${input.storeBaseUrl}/store/${input.storeSlug}</footer>
  </div>
  <script>
    document.getElementById('checkout-btn')?.addEventListener('click', function() {
      if (typeof gtag === 'function') gtag('event', 'begin_checkout', { currency: '${input.currency}', value: ${(input.priceCents / 100).toFixed(2)} });
      if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', { currency: '${input.currency}', value: ${(input.priceCents / 100).toFixed(2)} });
      if (typeof ttq === 'object' && ttq.track) ttq.track('InitiateCheckout', { currency: '${input.currency}', value: ${(input.priceCents / 100).toFixed(2)} });
    });
  </script>
</body>
</html>`;
}
