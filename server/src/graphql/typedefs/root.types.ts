import { gql } from "graphql-tag";

export const rootTypeDefs = gql`
  type Query {
    me: User
    prescriptions(status: PrescriptionStatus): [Prescription!]!
    prescription(id: ID!): Prescription
    upcomingDoses(limit: Int = 10): [Prescription!]!
  }

  type Mutation {
    # Auth
    signup(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    
    # Prescriptions
    createPrescription(input: CreatePrescriptionInput!): Prescription!
    updatePrescriptionStatus(input: UpdatePrescriptionStatusInput!): Prescription!
    
    # Dosing
    recordDose(input: RecordDoseInput!): DoseEvent!
    markDoseTaken(prescriptionId: ID!): Prescription!
  }
`;

export default rootTypeDefs;
