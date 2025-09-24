import _ from "lodash";
import { userResolvers } from "./user";
import { prescriptionResolvers } from "./prescription";

// Merge all resolvers
export const resolvers = _.merge(userResolvers, prescriptionResolvers);
