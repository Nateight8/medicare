# Prescription Tracker App – MVP PRD

## 1. Goal

Build a simple mobile app that helps users manage their medical prescriptions with reminders. The MVP focuses on testing user adoption and gathering feedback.

---

## 2. Core Features

1. **User Accounts**

   - Sign up / login (email or phone)
   - Basic profile: name, email/phone

2. **Prescription Management**

   - Add prescriptions (drug name, dosage, frequency, duration)
   - Edit or delete prescriptions
   - View active & past prescriptions

3. **Reminders (Push Notifications)**

   - Notify user at scheduled times based on prescription frequency

4. **Basic Analytics/Logs**
   - Track when users mark doses as taken

---

## 3. User Flow

1. User logs in or creates an account
2. Lands on home screen with active prescriptions
3. Adds a prescription with reminder times
4. Receives notifications and marks dose as taken
5. Prescription auto-completes after duration

---

## 4. Success Metrics

- Number of prescriptions added per user
- % of reminders acted on (marked as taken)
- Daily active users (DAU)

---

## 5. Technical Scope

- **Mobile:** Expo (React Native) + Apollo Client (GraphQL)
- **Backend:** Node.js (Apollo Server) + Prisma + PostgreSQL
- **Push Notifications:** Expo Notifications
- **Hosting:** Railway/Render for backend
