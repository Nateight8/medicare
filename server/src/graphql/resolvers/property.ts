import { PropertyType, PropertyStatus } from "../typedefs";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: PropertyType;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration
const mockProperties: Property[] = [
  {
    id: "1",
    title: "Modern 3-Bedroom Apartment",
    description:
      "Beautiful apartment in the heart of Lagos with modern amenities",
    price: 25000000,
    location: "Victoria Island, Lagos",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    propertyType: PropertyType.APARTMENT,
    status: PropertyStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Luxury Villa with Pool",
    description: "Spacious villa with private pool and garden",
    price: 85000000,
    location: "Lekki, Lagos",
    bedrooms: 5,
    bathrooms: 4,
    area: 350,
    propertyType: PropertyType.VILLA,
    status: PropertyStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Office Space in Business District",
    description: "Prime office space in the central business district",
    price: 15000000,
    location: "Ikeja, Lagos",
    bedrooms: 0,
    bathrooms: 2,
    area: 200,
    propertyType: PropertyType.OFFICE,
    status: PropertyStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper functions
const findPropertyById = (id: string): Property | undefined => {
  return mockProperties.find((property) => property.id === id);
};

const createNewProperty = (data: Partial<Property>): Property => {
  const newProperty: Property = {
    id: (mockProperties.length + 1).toString(),
    title: data.title!,
    description: data.description || "",
    price: data.price!,
    location: data.location!,
    bedrooms: data.bedrooms || 0,
    bathrooms: data.bathrooms || 0,
    area: data.area || 0,
    propertyType: data.propertyType!,
    status: PropertyStatus.AVAILABLE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return newProperty;
};

const updateExistingProperty = (
  id: string,
  updates: Partial<Property>
): Property => {
  const existingProperty = findPropertyById(id);
  if (!existingProperty) {
    throw new Error("Property not found");
  }

  const updatedProperty = {
    ...existingProperty,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const propertyIndex = mockProperties.findIndex(
    (property) => property.id === id
  );
  mockProperties[propertyIndex] = updatedProperty;

  return updatedProperty;
};

// Property resolvers
export const propertyResolvers = {
  Query: {
    properties: () => mockProperties,

    property: (_: any, { id }: { id: string }) => {
      return findPropertyById(id);
    },

    propertiesByType: (_: any, { type }: { type: PropertyType }) => {
      return mockProperties.filter(
        (property) => property.propertyType === type
      );
    },

    propertiesByLocation: (_: any, { location }: { location: string }) => {
      return mockProperties.filter((property) =>
        property.location.toLowerCase().includes(location.toLowerCase())
      );
    },
  },

  Mutation: {
    createProperty: (_: any, args: Partial<Property>) => {
      const newProperty = createNewProperty(args);
      mockProperties.push(newProperty);
      return newProperty;
    },

    updateProperty: (
      _: any,
      { id, ...updates }: { id: string } & Partial<Property>
    ) => {
      return updateExistingProperty(id, updates);
    },

    deleteProperty: (_: any, { id }: { id: string }) => {
      const propertyIndex = mockProperties.findIndex(
        (property) => property.id === id
      );

      if (propertyIndex === -1) {
        return false;
      }

      mockProperties.splice(propertyIndex, 1);
      return true;
    },
  },
};
