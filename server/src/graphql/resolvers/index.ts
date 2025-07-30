import _ from "lodash";
import { propertyResolvers } from "./property";

// Merge all resolvers using lodash.merge
export const resolvers = _.merge({}, propertyResolvers);
