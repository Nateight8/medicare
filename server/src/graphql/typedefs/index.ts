import { propertyTypeDefs } from "./property";

// Re-export the enums for use in resolvers
export { PropertyType, PropertyStatus } from "./property";

// Export the combined type definitions
export const typeDefs = propertyTypeDefs;
