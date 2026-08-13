import { COLLECTION_FRAGMENT, PRODUCT_FRAGMENT } from "./fragments";

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts(
    $first: Int = 24
    $query: String
    $sortKey: ProductSortKeys = RELEVANCE
    $reverse: Boolean = false
  ) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        node {
          ...ProductFragment
        }
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_PRODUCT_QUERY = /* GraphQL */ `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      ...ProductFragment
      collections(first: 5) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_PRODUCT_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query GetProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      ...ProductFragment
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_COLLECTIONS_QUERY = /* GraphQL */ `
  query GetCollections($first: Int = 20) {
    collections(first: $first, sortKey: TITLE) {
      edges {
        node {
          ...CollectionFragment
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
`;

export const GET_COLLECTION_QUERY = /* GraphQL */ `
  query GetCollection($handle: String!) {
    collection(handle: $handle) {
      ...CollectionFragment
    }
  }
  ${COLLECTION_FRAGMENT}
`;

export const GET_COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  query GetCollectionProducts(
    $handle: String!
    $first: Int = 24
    $sortKey: ProductCollectionSortKeys = COLLECTION_DEFAULT
    $reverse: Boolean = false
  ) {
    collection(handle: $handle) {
      ...CollectionFragment
      products(first: $first, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            ...ProductFragment
          }
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;
