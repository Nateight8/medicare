import { mergeTypeDefs } from "@graphql-tools/merge";

// Import type definitions
import userTypeDefs from "./user.types";
import prescriptionTypeDefs from "./prescription.types";
import rootTypeDefs from "./root.types";
import { authTypeDefs } from "./auth.types";

// Combine all type definitions
export const typeDefs = mergeTypeDefs([
  userTypeDefs,
  prescriptionTypeDefs,
  rootTypeDefs,
  authTypeDefs,
]);
