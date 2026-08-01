/**
 * SEO & Structured Data Helper
 * Generates Schema.org JSON-LD scripts and updates page metadata dynamically.
 */

export function updatePageSEO({ title, description, image, type = "website", canonicalUrl }) {
  if (typeof document === "undefined") return;

  const siteName = "VELUX KICKS";
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Premium Footwear & Apparel`;
  document.title = fullTitle;

  // Update Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description || "Discover premium sneakers, running shoes, watches, and accessories at VELUX KICKS. Fast delivery, easy returns, and secure checkout.";

  // Update OpenGraph Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.content = fullTitle;

  // Update OpenGraph Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement("meta");
    ogDesc.setAttribute("property", "og:description");
    document.head.appendChild(ogDesc);
  }
  ogDesc.content = metaDesc.content;

  // Update OpenGraph Image
  if (image) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement("meta");
      ogImg.setAttribute("property", "og:image");
      document.head.appendChild(ogImg);
    }
    ogImg.content = image;
  }
}

export function injectProductJsonLd(product) {
  if (typeof document === "undefined" || !product) return;

  const scriptId = "product-jsonld-schema";
  let existingScript = document.getElementById(scriptId);
  if (existingScript) {
    existingScript.remove();
  }

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [product.image_url],
    "description": product.description || `Premium quality ${product.name}`,
    "brand": {
      "@type": "Brand",
      "name": "VELUX KICKS"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  const script = document.createElement("script");
  script.id = scriptId;
  script.type = "application/ld+json";
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}
