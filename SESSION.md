# Session Management Architecture

## Overview
This document outlines the architecture for managing user sessions in the application, including active device tracking, session validation, and security considerations.

## Data Model

### Session Schema
```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent   String?  @map("user_agent")
  ip          String?
  deviceType  String?  @map("device_type")  // 'mobile', 'desktop', 'tablet'
  deviceName  String?  @map("device_name")
  os          String?
  browser     String?
  city        String?
  region      String?
  country     String?
  lastActive  DateTime @map("last_active") @default(now())
  createdAt   DateTime @default(now()) @map("created_at")
  expiresAt   DateTime @map("expires_at")
  isActive    Boolean  @default(true) @map("is_active")
  
  @@map("sessions")
}
```

## API Endpoints

### Queries
```graphql
type Query {
  """Get all active sessions for the current user"""
  mySessions: [Session!]!
}
```

### Mutations
```graphql
type Mutation {
  """Revoke a specific session"""
  revokeSession(sessionId: ID!): Boolean!
  
  """Revoke all sessions except the current one"""
  revokeAllOtherSessions: Boolean!
  
  """Update last active timestamp"""
  updateSessionActivity(sessionId: ID!): Boolean!
}
```

## Frontend Implementation

### Session Context
```typescript
interface Session {
  id: string;
  deviceName: string;
  os: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}
```

### Key Components
1. **SessionProvider**: Manages session state
2. **SessionList**: Displays active sessions
3. **SessionItem**: Individual session card with actions

## Security Considerations

### Session Validation
- Validate session on each authenticated request
- Check session expiration
- Verify IP address matches original session (optional)

### Rate Limiting
- Implement rate limiting for session-related endpoints
- Track failed login attempts

### Data Protection
- Never expose sensitive session details
- Hash session tokens before storage
- Use secure, HTTP-only cookies for session storage

## Workflow

### New Session Creation
1. User authenticates
2. Server creates session record
3. Session token issued to client
4. Client stores token securely

### Session Validation
1. Client includes token in requests
2. Server validates token and session
3. Updates `lastActive` timestamp
4. Returns requested data or error

### Session Termination
1. User or system revokes session
2. Server marks session as inactive
3. Client is logged out on next request

## Future Considerations
- Implement device fingerprinting
- Add two-factor authentication
- Session activity notifications
- Suspicious activity detection
