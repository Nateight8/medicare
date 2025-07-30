import { gql } from "graphql-tag";

export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOUSE = "HOUSE",
  VILLA = "VILLA",
  OFFICE = "OFFICE",
  SHOP = "SHOP",
  LAND = "LAND",
}

export enum PropertyStatus {
  AVAILABLE = "AVAILABLE",
  SOLD = "SOLD",
  RENTED = "RENTED",
  PENDING = "PENDING",
}

export const propertyTypeDefs = gql`
  type Property {
    id: ID!
    title: String!
    description: String
    price: Float!
    location: String!
    bedrooms: Int
    bathrooms: Int
    area: Float
    propertyType: PropertyType!
    status: PropertyStatus!
    createdAt: String!
    updatedAt: String!
  }

  enum PropertyType {
    APARTMENT
    HOUSE
    VILLA
    OFFICE
    SHOP
    LAND
  }

  enum PropertyStatus {
    AVAILABLE
    SOLD
    RENTED
    PENDING
  }

  type Query {
    properties: [Property!]!
    property(id: ID!): Property
    propertiesByType(type: PropertyType!): [Property!]!
    propertiesByLocation(location: String!): [Property!]!
  }

  type Mutation {
    createProperty(
      title: String!
      description: String
      price: Float!
      location: String!
      bedrooms: Int
      bathrooms: Int
      area: Float
      propertyType: PropertyType!
    ): Property!

    updateProperty(
      id: ID!
      title: String
      description: String
      price: Float
      location: String
      bedrooms: Int
      bathrooms: Int
      area: Float
      propertyType: PropertyType
      status: PropertyStatus
    ): Property!

    deleteProperty(id: ID!): Boolean!
  }
`;
