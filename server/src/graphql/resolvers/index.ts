import _ from 'lodash';
import { authResolvers } from './auth.resolvers';
import { prescriptionResolvers } from './prescription.resolvers';
import { magicLinkResolvers } from './magicLink.resolvers';

// Merge all resolvers
export const resolvers = _.merge(
  {},
  authResolvers,
  prescriptionResolvers,
  magicLinkResolvers
);
