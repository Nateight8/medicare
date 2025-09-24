import { mergeTypeDefs } from "@graphql-tools/merge";

// Import type definitions

import prescriptionTypeDefs from "./prescription";
import rootTypeDefs from "./root.types";
import { userTypeDefs } from "./user";

// Combine all type definitions
export const typeDefs = mergeTypeDefs([
  prescriptionTypeDefs,
  rootTypeDefs,
  userTypeDefs,
]);
