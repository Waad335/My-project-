export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFragment on MoneyV2 {
    amount
    currencyCode
  }
`;

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFragment on Image {
    url
    altText
    width
    height
  }
`;

export const SEO_FRAGMENT = /* GraphQL */ `
  fragment SeoFragment on SEO {
    title
    description
  }
`;

export const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    availableForSale
    productType
    vendor
    tags
    updatedAt
    featuredImage {
      ...ImageFragment
    }
    images(first: 12) {
      edges {
        node {
          ...ImageFragment
        }
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyFragment
      }
      maxVariantPrice {
        ...MoneyFragment
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyFragment
      }
      maxVariantPrice {
        ...MoneyFragment
      }
    }
    options {
      id
      name
      optionValues {
        name
      }
    }
    variants(first: 25) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            ...MoneyFragment
          }
          compareAtPrice {
            ...MoneyFragment
          }
          selectedOptions {
            name
            value
          }
          image {
            ...ImageFragment
          }
        }
      }
    }
    seo {
      ...SeoFragment
    }
    metafields(
      identifiers: [
        { namespace: "veloura", key: "file_formats" }
        { namespace: "veloura", key: "page_count" }
        { namespace: "veloura", key: "canva_compatible" }
        { namespace: "veloura", key: "editable" }
        { namespace: "veloura", key: "included_files" }
        { namespace: "veloura", key: "license" }
        { namespace: "veloura", key: "instant_download" }
      ]
    ) {
      key
      namespace
      value
      type
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const COLLECTION_FRAGMENT = /* GraphQL */ `
  fragment CollectionFragment on Collection {
    id
    handle
    title
    description
    descriptionHtml
    image {
      ...ImageFragment
    }
    seo {
      ...SeoFragment
    }
  }
  ${IMAGE_FRAGMENT}
  ${SEO_FRAGMENT}
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        ...MoneyFragment
      }
      totalAmount {
        ...MoneyFragment
      }
      totalTaxAmount {
        ...MoneyFragment
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              ...MoneyFragment
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              image {
                ...ImageFragment
              }
              product {
                handle
                title
              }
            }
          }
        }
      }
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;
