export type PixelScriptInput = {
  ga4MeasurementId?: string | null;
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  currency?: string;
  productValue?: number;
};

/** Builds client-side GA4, Meta Pixel, and TikTok Pixel script block. */
export function buildConversionPixelScripts(input: PixelScriptInput): string {
  const lines: string[] = [];

  if (input.ga4MeasurementId && !input.ga4MeasurementId.includes("BLUEPRINT")) {
    lines.push(`
<script async src="https://www.googletagmanager.com/gtag/js?id=${input.ga4MeasurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${input.ga4MeasurementId}');
</script>`);
  }

  if (input.metaPixelId && !input.metaPixelId.includes("BLUEPRINT")) {
    lines.push(`
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${input.metaPixelId}');
  fbq('track', 'PageView');
</script>`);
  }

  if (input.tiktokPixelId && !input.tiktokPixelId.includes("BLUEPRINT")) {
    lines.push(`
<script>
  !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))};};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
  var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
  var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${input.tiktokPixelId}'); ttq.page();
}(window,document,'ttq');
</script>`);
  }

  const value = input.productValue ?? 0;
  const currency = input.currency ?? "USD";

  lines.push(`
<script>
  window.empireTrackCheckout = function() {
    if (typeof gtag === 'function') gtag('event', 'begin_checkout', { currency: '${currency}', value: ${value} });
    if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', { currency: '${currency}', value: ${value} });
    if (typeof ttq === 'object' && ttq.track) ttq.track('InitiateCheckout', { currency: '${currency}', value: ${value} });
  };
  window.empireTrackPurchase = function(transactionId, value) {
    if (typeof gtag === 'function') gtag('event', 'purchase', { transaction_id: transactionId, currency: '${currency}', value: value });
    if (typeof fbq === 'function') fbq('track', 'Purchase', { currency: '${currency}', value: value });
    if (typeof ttq === 'object' && ttq.track) ttq.track('CompletePayment', { currency: '${currency}', value: value });
  };
</script>`);

  return lines.join("\n");
}
