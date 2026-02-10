# User Activity Audit Feature - Testing Guide

## Overview
This feature allows administrators to track user activity, including login events and accomplishment views, for specific users on the DSI Team Site.

## Feature Highlights

### 1. Opt-in Audit Tracking
- Audit tracking is **disabled by default** for all users
- Administrators can enable/disable audit tracking per user from the Users page
- Only users with audit enabled will have their activities logged

### 2. Activity Types Tracked
- **Login Events**: Logged when a user successfully authenticates via Azure SSO
- **Accomplishment Views**: Logged when a user's accomplishments are viewed by others in the AccomplishmentsTable

### 3. User Interface Changes

#### Users Page (`/users`)
- New "Audit Enabled" column with toggle button (Enabled/Disabled)
- Click to toggle audit tracking on/off for any user
- New "Actions" column with "View Logs" link (only visible for users with audit enabled)

#### User Activity Logs Page (`/user-activity-logs/:badge`)
- Displays activity history for a specific user
- Shows timestamp, activity type, accomplishment ID (if applicable), and metadata
- Includes a "Back to Users" button for easy navigation
- Activity types are color-coded:
  - Login: Green badge
  - View Accomplishment: Blue badge

## Testing Instructions

### Step 1: Enable Audit for a User
1. Navigate to `/users` page
2. Find the user you want to track (e.g., badge 96880)
3. In the "Audit Enabled" column, click the "Disabled" button
4. The button should change to "Enabled" (blue badge)
5. A "View Logs" link should appear in the Actions column

### Step 2: Test Login Tracking
1. Note the user you enabled audit for
2. Have that user log out and log back in
3. The login activity should be captured (if audit is enabled)
4. Go back to `/users` and click "View Logs" for that user
5. You should see a login entry with a timestamp

### Step 3: Test Accomplishment View Tracking
1. With audit enabled for a user, navigate to `/view-accomplishments`
2. Select a week where the audited user has submitted accomplishments
3. The system will automatically log when their accomplishments are viewed
4. Go to `/user-activity-logs/:badge` for that user
5. You should see "View Accomplishment" entries with accomplishment IDs

### Step 4: Disable Audit for a User
1. Navigate to `/users` page
2. Click the "Enabled" button in the "Audit Enabled" column
3. The button should change back to "Disabled" (gray badge)
4. The "View Logs" link should disappear
5. No new activities will be logged for this user (existing logs remain)

## API Endpoints

### Backend Endpoints
- `GET /api/user-activity-logs` - Get all activity logs
- `GET /api/user-activity-logs/badge/:badge` - Get logs for specific user
- `POST /api/user-activity-logs` - Create new activity log
- `PUT /api/users/badge/:badge/toggle-audit` - Toggle audit for a user

### Request/Response Examples

#### Toggle Audit
```bash
PUT /api/users/badge/96880/toggle-audit
Content-Type: application/json

{
  "auditEnabled": true
}
```

#### Create Activity Log
```bash
POST /api/user-activity-logs
Content-Type: application/json

{
  "badge": 96880,
  "activityType": "login",
  "metadata": "{\"timestamp\":\"2026-02-10T23:00:00.000Z\"}"
}
```

#### Get User Activity Logs
```bash
GET /api/user-activity-logs/badge/96880
```

Response:
```json
[
  {
    "id": 1,
    "activityType": "login",
    "timestamp": "2026-02-10T23:00:00.000Z",
    "accomplishmentId": null,
    "metadata": "{\"timestamp\":\"2026-02-10T23:00:00.000Z\"}",
    "user": {
      "badge": 96880,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  }
]
```

## Database Schema

### UserActivityLog Entity
```typescript
{
  id: number (PK, auto-increment)
  user: User (FK to badge)
  activityType: string ('login' | 'view_accomplishment')
  timestamp: Date (auto-generated on create)
  accomplishmentId: number | null
  metadata: string | null (JSON string)
}
```

### User Entity Updates
```typescript
{
  // ... existing fields
  auditEnabled: boolean (default: false)
}
```

## Important Notes

### Non-Blocking Logging
- Activity logging is designed to be **non-blocking**
- If logging fails, the user's experience is not affected
- Errors are logged to the console but do not disrupt normal operations

### Privacy Considerations
- Only administrators have access to the Users page and can enable audit tracking
- Users are not notified when audit is enabled for their account
- Activity logs are only visible to administrators
- Logs persist even after audit is disabled (historical record)

### Performance Considerations
- Logging operations are asynchronous and don't block the UI
- The service checks `auditEnabled` flag before creating log entries
- No logs are created for users with audit disabled (minimal overhead)

## Troubleshooting

### Logs Not Being Created
1. Verify audit is enabled for the user in the database
2. Check browser console for any errors during activity
3. Verify the backend service is running and endpoints are accessible
4. Check server logs for any database or service errors

### Toggle Not Working
1. Verify network connectivity to the backend API
2. Check that the user has proper permissions to update users
3. Verify the endpoint `/api/users/badge/:badge/toggle-audit` is responding
4. Check browser console for any JavaScript errors

### View Logs Page Shows No Data
1. Verify audit was enabled before the activities occurred
2. Check if any activities have actually been performed
3. Verify the badge number in the URL is correct
4. Check browser console and network tab for API errors

## Security Summary
- ✅ No security vulnerabilities found by CodeQL analysis
- ✅ Input validation on all API endpoints
- ✅ Activity logs use proper foreign key relationships
- ✅ Non-blocking error handling prevents information leakage
- ✅ Access control through existing authentication/authorization
