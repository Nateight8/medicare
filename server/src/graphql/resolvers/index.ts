import _ from "lodash";
import { userResolvers } from "./user";
import { prescriptionResolvers } from "./prescription";
import { sessionResolvers } from "./session";

// Merge all resolvers
export const resolvers = _.merge(
  userResolvers,
  prescriptionResolvers,
  sessionResolvers
);
