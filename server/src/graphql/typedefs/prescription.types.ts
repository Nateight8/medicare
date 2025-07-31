import { gql } from "graphql-tag";

export const prescriptionTypeDefs = gql`
  """
  Represents a medication prescription with all its details and tracking information.
  This type is used to track medication schedules, dosages, and adherence.
  """
  type Prescription {
    """Globally unique identifier for the prescription"""
    id: ID!
    
    """The user who is prescribed this medication"""
    user: User!
    
    """Brand or generic name of the prescribed medication"""
    drugName: String!
    
    """Dosage instructions (e.g., '10mg', '1 tablet', '2 puffs')"""
    dosage: String!
    
    """
    Frequency of medication intake in hours.
    Example: 8 for every 8 hours, 24 for once daily
    """
    intervalHours: Int!
    
    """
    Date and time when the prescription becomes active (ISO 8601 format).
    The first dose is scheduled based on this date.
    """
    startDate: String!
    
    """
    Date and time when the prescription is no longer active (ISO 8601 format).
    No reminders will be scheduled after this date.
    """
    endDate: String!
    
    """Current status of the prescription (active, paused, or completed)"""
    status: PrescriptionStatus!
    
    """
    Strategy used to calculate the next due time for medication.
    - FROM_LAST_TAKEN: Next dose is calculated from when the last dose was taken
    - FROM_SCHEDULED_TIME: Next dose is calculated from the original schedule
    """
    anchorStrategy: AnchorStrategy!
    
    """
    The next scheduled date and time when the medication should be taken (ISO 8601 format).
    This is automatically calculated based on the interval and anchor strategy.
    """
    nextDueAt: String!
    
    """
    The date and time when the last dose was taken (ISO 8601 format).
    Null if no doses have been taken yet.
    """
    lastTakenAt: String
    
    """Total number of doses taken so far"""
    dosesTaken: Int!
    
    """Number of doses that were missed or skipped"""
    missedCount: Int!
    
    """Optional notes about the prescription (e.g., 'Take with food')"""
    notes: String
    
    """History of all dose events (taken or skipped) for this prescription"""
    doseEvents: [DoseEvent!]!
    
    """When this prescription was created (ISO 8601 format)"""
    createdAt: String!
    
    """When this prescription was last updated (ISO 8601 format)"""
    updatedAt: String!
  }

  """
  Represents a single dose event - when a medication was taken or skipped.
  This provides a complete history of all medication-related actions.
  """
  type DoseEvent {
    """Globally unique identifier for this dose event"""
    id: ID!
    
    """The prescription this dose event is associated with"""
    prescription: Prescription!
    
    """The user who performed this action"""
    user: User!
    
    """
    The actual date and time when the action occurred (ISO 8601 format).
    For taken doses, this is when the user marked it as taken.
    """
    occurredAt: String!
    
    """
    The scheduled date and time when this dose was supposed to be taken (ISO 8601 format).
    This helps track if the dose was taken on time.
    """
    scheduledFor: String!
    
    """Whether the dose was taken or skipped"""
    action: DoseAction!
    
    """
    How many minutes early (-) or late (+) the dose was taken compared to the scheduled time.
    Null if the action is 'SKIPPED'.
    """
    latencyMinutes: Int
    
    """Optional note about this specific dose (e.g., 'Took with food')"""
    note: String
    
    """When this dose event was recorded (ISO 8601 format)"""
    createdAt: String!
  }

  """
  Represents the current status of a prescription.
  """
  enum PrescriptionStatus {
    """Prescription is active and reminders are being sent"""
    ACTIVE
    
    """Prescription is temporarily paused (no reminders will be sent)"""
    PAUSED
    
    """Prescription has been completed (all doses taken or end date reached)"""
    COMPLETED
  }

  """
  Strategy used to calculate the next dose time.
  """
  enum AnchorStrategy {
    """
    Calculate next dose based on when the last dose was actually taken.
    This can cause the schedule to shift over time.
    """
    FROM_LAST_TAKEN
    
    """
    Calculate next dose based on the original schedule.
    Missed doses don't affect the timing of future doses.
    """
    FROM_SCHEDULED_TIME
  }

  """
  Represents the action taken for a scheduled dose.
  """
  enum DoseAction {
    """The dose was taken by the user"""
    TAKEN
    
    """The dose was intentionally skipped"""
    SKIPPED
  }

  """
  Input type for creating a new prescription.
  """
  input CreatePrescriptionInput {
    """Name of the medication being prescribed"""
    drugName: String!
    
    """Dosage instructions (e.g., '10mg', '1 tablet')"""
    dosage: String!
    
    """
    How often the medication should be taken, in hours.
    Must be a positive integer.
    """
    intervalHours: Int!
    
    """
    When the prescription should start (ISO 8601 format).
    The first dose will be scheduled based on this time.
    """
    startDate: String!
    
    """
    When the prescription should end (ISO 8601 format).
    No reminders will be scheduled after this date.
    """
    endDate: String!
    
    """
    Strategy for calculating the next dose time.
    Defaults to FROM_LAST_TAKEN if not specified.
    """
    anchorStrategy: AnchorStrategy = FROM_LAST_TAKEN
    
    """Optional notes about the prescription"""
    notes: String
  }

  """
  Input type for recording when a dose is taken or skipped.
  """
  input RecordDoseInput {
    """ID of the prescription this dose is for"""
    prescriptionId: ID!
    
    """Whether the dose was taken or skipped"""
    action: DoseAction!
    
    """Optional note about this specific dose"""
    note: String
  }

  """
  Input type for updating a prescription's status.
  """
  input UpdatePrescriptionStatusInput {
    """ID of the prescription to update"""
    prescriptionId: ID!
    
    """New status for the prescription"""
    status: PrescriptionStatus!
  }
`;

export default prescriptionTypeDefs;
