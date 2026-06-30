import type { Country, ProviderEntry, Region } from "../models/global-registry.js";

export const GLOBAL_REGIONS: Region[] = [
  { regionId: "apac", displayName: "Asia-Pacific", countryCodes: ["SG", "MY", "ID", "TH", "PH", "VN", "JP", "KR", "CN", "IN", "AU"] },
  { regionId: "americas", displayName: "Americas", countryCodes: ["US", "BR", "MX"] },
  { regionId: "emea", displayName: "Europe, Middle East & Africa", countryCodes: ["GB", "DE", "FR", "ZA", "NG"] },
];

export const GLOBAL_COUNTRIES: Country[] = [
  { countryCode: "SG", displayName: "Singapore", regionId: "apac", currency: "SGD", languages: ["en", "zh", "ms", "ta"], commerceDomains: ["marketplace", "payment", "logistics", "advertising", "analytics"] },
  { countryCode: "MY", displayName: "Malaysia", regionId: "apac", currency: "MYR", languages: ["ms", "en", "zh"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "ID", displayName: "Indonesia", regionId: "apac", currency: "IDR", languages: ["id", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "TH", displayName: "Thailand", regionId: "apac", currency: "THB", languages: ["th", "en"], commerceDomains: ["marketplace", "payment", "logistics"] },
  { countryCode: "PH", displayName: "Philippines", regionId: "apac", currency: "PHP", languages: ["en", "fil"], commerceDomains: ["marketplace", "payment", "logistics"] },
  { countryCode: "VN", displayName: "Vietnam", regionId: "apac", currency: "VND", languages: ["vi", "en"], commerceDomains: ["marketplace", "payment", "logistics"] },
  { countryCode: "US", displayName: "United States", regionId: "americas", currency: "USD", languages: ["en", "es"], commerceDomains: ["marketplace", "supplier", "payment", "logistics", "advertising", "analytics", "customer_service"] },
  { countryCode: "GB", displayName: "United Kingdom", regionId: "emea", currency: "GBP", languages: ["en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising", "analytics"] },
  { countryCode: "DE", displayName: "Germany", regionId: "emea", currency: "EUR", languages: ["de", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "FR", displayName: "France", regionId: "emea", currency: "EUR", languages: ["fr", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "JP", displayName: "Japan", regionId: "apac", currency: "JPY", languages: ["ja", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "KR", displayName: "South Korea", regionId: "apac", currency: "KRW", languages: ["ko", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "CN", displayName: "China", regionId: "apac", currency: "CNY", languages: ["zh"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "IN", displayName: "India", regionId: "apac", currency: "INR", languages: ["en", "hi"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "AU", displayName: "Australia", regionId: "apac", currency: "AUD", languages: ["en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "BR", displayName: "Brazil", regionId: "americas", currency: "BRL", languages: ["pt", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "MX", displayName: "Mexico", regionId: "americas", currency: "MXN", languages: ["es", "en"], commerceDomains: ["marketplace", "payment", "logistics", "advertising"] },
  { countryCode: "ZA", displayName: "South Africa", regionId: "emea", currency: "ZAR", languages: ["en", "af", "zu"], commerceDomains: ["marketplace", "payment", "logistics"] },
  { countryCode: "NG", displayName: "Nigeria", regionId: "emea", currency: "NGN", languages: ["en"], commerceDomains: ["marketplace", "payment", "logistics"] },
];

/** B-006 — Country marketplace and provider coverage (architecture registry). */
export const GLOBAL_MARKETPLACE_PROVIDERS: ProviderEntry[] = [
  // Singapore
  { providerId: "shopee-sg", displayName: "Shopee SG", domain: "marketplace", countryCode: "SG" },
  { providerId: "lazada-sg", displayName: "Lazada SG", domain: "marketplace", countryCode: "SG" },
  { providerId: "tiktok-shop-sg", displayName: "TikTok Shop SG", domain: "marketplace", countryCode: "SG", realityProviderId: "tiktok-shop" },
  { providerId: "amazon-sg", displayName: "Amazon SG", domain: "marketplace", countryCode: "SG", realityProviderId: "amazon-seller" },
  { providerId: "qoo10-sg", displayName: "Qoo10", domain: "marketplace", countryCode: "SG" },
  { providerId: "carousell-sg", displayName: "Carousell", domain: "marketplace", countryCode: "SG" },
  // Malaysia
  { providerId: "shopee-my", displayName: "Shopee MY", domain: "marketplace", countryCode: "MY" },
  { providerId: "lazada-my", displayName: "Lazada MY", domain: "marketplace", countryCode: "MY" },
  { providerId: "tiktok-shop-my", displayName: "TikTok Shop MY", domain: "marketplace", countryCode: "MY", realityProviderId: "tiktok-shop" },
  // Indonesia
  { providerId: "tokopedia-id", displayName: "Tokopedia", domain: "marketplace", countryCode: "ID" },
  { providerId: "shopee-id", displayName: "Shopee ID", domain: "marketplace", countryCode: "ID" },
  { providerId: "lazada-id", displayName: "Lazada ID", domain: "marketplace", countryCode: "ID" },
  { providerId: "tiktok-shop-id", displayName: "TikTok Shop ID", domain: "marketplace", countryCode: "ID", realityProviderId: "tiktok-shop" },
  { providerId: "bukalapak-id", displayName: "Bukalapak", domain: "marketplace", countryCode: "ID" },
  // Thailand
  { providerId: "shopee-th", displayName: "Shopee TH", domain: "marketplace", countryCode: "TH" },
  { providerId: "lazada-th", displayName: "Lazada TH", domain: "marketplace", countryCode: "TH" },
  { providerId: "tiktok-shop-th", displayName: "TikTok Shop TH", domain: "marketplace", countryCode: "TH", realityProviderId: "tiktok-shop" },
  // Philippines
  { providerId: "shopee-ph", displayName: "Shopee PH", domain: "marketplace", countryCode: "PH" },
  { providerId: "lazada-ph", displayName: "Lazada PH", domain: "marketplace", countryCode: "PH" },
  { providerId: "tiktok-shop-ph", displayName: "TikTok Shop PH", domain: "marketplace", countryCode: "PH", realityProviderId: "tiktok-shop" },
  // Vietnam
  { providerId: "shopee-vn", displayName: "Shopee VN", domain: "marketplace", countryCode: "VN" },
  { providerId: "lazada-vn", displayName: "Lazada VN", domain: "marketplace", countryCode: "VN" },
  { providerId: "tiktok-shop-vn", displayName: "TikTok Shop VN", domain: "marketplace", countryCode: "VN", realityProviderId: "tiktok-shop" },
  { providerId: "tiki-vn", displayName: "Tiki", domain: "marketplace", countryCode: "VN" },
  // United States
  { providerId: "amazon-us", displayName: "Amazon US", domain: "marketplace", countryCode: "US", realityProviderId: "amazon-seller" },
  { providerId: "ebay-us", displayName: "eBay US", domain: "marketplace", countryCode: "US", realityProviderId: "ebay" },
  { providerId: "walmart-us", displayName: "Walmart", domain: "marketplace", countryCode: "US", realityProviderId: "walmart" },
  { providerId: "shopify-us", displayName: "Shopify", domain: "marketplace", countryCode: "US", runtimePluginId: "shopify", realityProviderId: "shopify" },
  { providerId: "tiktok-shop-us", displayName: "TikTok Shop US", domain: "marketplace", countryCode: "US", realityProviderId: "tiktok-shop" },
  { providerId: "etsy-us", displayName: "Etsy", domain: "marketplace", countryCode: "US" },
  // United Kingdom
  { providerId: "amazon-uk", displayName: "Amazon UK", domain: "marketplace", countryCode: "GB", realityProviderId: "amazon-seller" },
  { providerId: "ebay-uk", displayName: "eBay UK", domain: "marketplace", countryCode: "GB", realityProviderId: "ebay" },
  { providerId: "shopify-uk", displayName: "Shopify", domain: "marketplace", countryCode: "GB", runtimePluginId: "shopify", realityProviderId: "shopify" },
  { providerId: "etsy-uk", displayName: "Etsy", domain: "marketplace", countryCode: "GB" },
  // Germany
  { providerId: "amazon-de", displayName: "Amazon DE", domain: "marketplace", countryCode: "DE", realityProviderId: "amazon-seller" },
  { providerId: "ebay-de", displayName: "eBay DE", domain: "marketplace", countryCode: "DE", realityProviderId: "ebay" },
  { providerId: "otto-de", displayName: "Otto", domain: "marketplace", countryCode: "DE" },
  { providerId: "kaufland-de", displayName: "Kaufland", domain: "marketplace", countryCode: "DE" },
  { providerId: "shopify-de", displayName: "Shopify", domain: "marketplace", countryCode: "DE", runtimePluginId: "shopify", realityProviderId: "shopify" },
  // France
  { providerId: "amazon-fr", displayName: "Amazon FR", domain: "marketplace", countryCode: "FR", realityProviderId: "amazon-seller" },
  { providerId: "cdiscount-fr", displayName: "Cdiscount", domain: "marketplace", countryCode: "FR" },
  { providerId: "fnac-fr", displayName: "Fnac", domain: "marketplace", countryCode: "FR" },
  { providerId: "ebay-fr", displayName: "eBay FR", domain: "marketplace", countryCode: "FR", realityProviderId: "ebay" },
  // Japan
  { providerId: "amazon-jp", displayName: "Amazon JP", domain: "marketplace", countryCode: "JP", realityProviderId: "amazon-seller" },
  { providerId: "rakuten-jp", displayName: "Rakuten", domain: "marketplace", countryCode: "JP" },
  { providerId: "yahoo-shopping-jp", displayName: "Yahoo Shopping", domain: "marketplace", countryCode: "JP" },
  { providerId: "mercari-jp", displayName: "Mercari", domain: "marketplace", countryCode: "JP" },
  // South Korea
  { providerId: "coupang-kr", displayName: "Coupang", domain: "marketplace", countryCode: "KR" },
  { providerId: "gmarket-kr", displayName: "Gmarket", domain: "marketplace", countryCode: "KR" },
  { providerId: "11street-kr", displayName: "11Street", domain: "marketplace", countryCode: "KR" },
  { providerId: "naver-shopping-kr", displayName: "Naver Shopping", domain: "marketplace", countryCode: "KR" },
  // China
  { providerId: "taobao-cn", displayName: "Taobao", domain: "marketplace", countryCode: "CN" },
  { providerId: "tmall-cn", displayName: "Tmall", domain: "marketplace", countryCode: "CN" },
  { providerId: "jd-cn", displayName: "JD", domain: "marketplace", countryCode: "CN" },
  { providerId: "pinduoduo-cn", displayName: "Pinduoduo", domain: "marketplace", countryCode: "CN" },
  { providerId: "1688-cn", displayName: "1688", domain: "marketplace", countryCode: "CN" },
  // India
  { providerId: "amazon-in", displayName: "Amazon IN", domain: "marketplace", countryCode: "IN", realityProviderId: "amazon-seller" },
  { providerId: "flipkart-in", displayName: "Flipkart", domain: "marketplace", countryCode: "IN" },
  { providerId: "meesho-in", displayName: "Meesho", domain: "marketplace", countryCode: "IN" },
  // Australia
  { providerId: "amazon-au", displayName: "Amazon AU", domain: "marketplace", countryCode: "AU", realityProviderId: "amazon-seller" },
  { providerId: "ebay-au", displayName: "eBay AU", domain: "marketplace", countryCode: "AU", realityProviderId: "ebay" },
  { providerId: "catch-au", displayName: "Catch", domain: "marketplace", countryCode: "AU" },
  { providerId: "kogan-au", displayName: "Kogan", domain: "marketplace", countryCode: "AU" },
  // Brazil
  { providerId: "mercado-livre-br", displayName: "Mercado Livre", domain: "marketplace", countryCode: "BR" },
  { providerId: "magazine-luiza-br", displayName: "Magazine Luiza", domain: "marketplace", countryCode: "BR" },
  { providerId: "americanas-br", displayName: "Americanas", domain: "marketplace", countryCode: "BR" },
  // Mexico
  { providerId: "mercado-livre-mx", displayName: "Mercado Libre MX", domain: "marketplace", countryCode: "MX" },
  { providerId: "amazon-mx", displayName: "Amazon MX", domain: "marketplace", countryCode: "MX", realityProviderId: "amazon-seller" },
  // South Africa
  { providerId: "takealot-za", displayName: "Takealot", domain: "marketplace", countryCode: "ZA" },
  { providerId: "jumia-za", displayName: "Jumia", domain: "marketplace", countryCode: "ZA" },
  { providerId: "shopify-za", displayName: "Shopify", domain: "marketplace", countryCode: "ZA", runtimePluginId: "shopify", realityProviderId: "shopify" },
  // Nigeria
  { providerId: "jumia-ng", displayName: "Jumia", domain: "marketplace", countryCode: "NG" },
  { providerId: "konga-ng", displayName: "Konga", domain: "marketplace", countryCode: "NG" },
];

export const GLOBAL_PAYMENT_PROVIDERS: ProviderEntry[] = [
  { providerId: "stripe-global", displayName: "Stripe", domain: "payment", countryCode: "GLOBAL", realityProviderId: "stripe" },
  { providerId: "paypal-global", displayName: "PayPal", domain: "payment", countryCode: "GLOBAL", realityProviderId: "paypal" },
];

export const GLOBAL_SUPPLIER_PROVIDERS: ProviderEntry[] = [
  { providerId: "cj-global", displayName: "CJ Dropshipping", domain: "supplier", countryCode: "GLOBAL", realityProviderId: "cj-dropshipping" },
];

export const ALL_GLOBAL_PROVIDERS: ProviderEntry[] = [
  ...GLOBAL_MARKETPLACE_PROVIDERS,
  ...GLOBAL_PAYMENT_PROVIDERS,
  ...GLOBAL_SUPPLIER_PROVIDERS,
];
