# Task: Fix Client Creation & Improve Client Management Page

## Problem Analysis

Based on the screenshots provided:

1. **Issue 1: Missing Default Stages for New Clients**
   - Existing clients (e.g., "Content Reach Team") have 5 default REACH stages visible
   - Newly created client "Acme Corporation" shows "No accessible stages - You don't have permission to view any workflow stages yet"
   - Root cause: When creating a new client team, the system is not automatically creating the default 5 REACH workflow stages

2. **Issue 2: Existing Clients Not Listed in Client Management**
   - The Client Management page shows only 4 clients: TechVision Media Inc, Acme Corporation, Bright Future Media, Global Innovations Inc
   - Missing: "Content Reach Team" (the original agency team that has cards)
   - Likely cause: The client management page filters by `isClient: true`, but "Content Reach Team" might be marked as an agency team, not a client team

3. **Issue 3: Client Management UI Improvement**
   - Current: Card-based layout showing client information
   - Requested: Table-based layout using shadcn/ui Table component
   - Benefits: Better data density, sortable columns, easier scanning

## Implementation Plan

### Task 1: Fix Default Stage Creation for New Clients

**File to modify**: Find the client creation API route

**Steps**:
1. Search for the API route that handles client creation (likely `/api/teams/clients` or `/api/clients`)
2. Import the `createDefaultStages` function from `/lib/db/utils.ts:100`
3. After creating a new client team, automatically call `createDefaultStages(newClientId)`
4. Ensure this happens within the same transaction if possible

**Expected behavior**: When a new client is created, they should automatically get 5 default REACH stages:
- Research (position 1, color #3b82f6)
- Envision (position 2, color #8b5cf6)
- Assemble (position 3, color #f59e0b)
- Connect (position 4, color #10b981)
- Hone (position 5, color #ef4444)

### Task 2: Fix Client Listing Logic

**Files to investigate**:
- `/app/api/teams/clients/route.ts` (or similar)
- `/lib/db/utils.ts` - check if there's a `getClients()` function

**Steps**:
1. Find the API endpoint that returns the list of clients
2. Check the query logic - it should filter by `isClient: true`
3. Verify that "Content Reach Team" has `isClient: false` (it's an agency team, not a client)
4. Confirm that the 4 clients shown in the screenshot are correctly marked as `isClient: true`
5. The current behavior is likely correct - agency teams should NOT appear in client management

**Note**: This might not be a bug. "Content Reach Team" appears to be the agency's internal team, not a client. The client dropdown in card creation should show only actual clients (teams with `isClient: true`).

### Task 3: Migrate Client Management to Table Layout

**File to modify**: Find the Client Management page component (likely `/app/clients/page.tsx` or `/app/dashboard/clients/page.tsx`)

**Implementation**:
1. Use Context7 to fetch shadcn/ui Table component documentation
2. Create a new table-based layout with columns:
   - **Company Name** (client_company_name)
   - **Team Name** (name)
   - **Industry** (industry)
   - **Contact Email** (contact_email)
   - **Created Date** (created_at)
   - **Actions** (Edit/Delete buttons)
3. Add sortable column headers
4. Keep the search functionality
5. Add pagination if there are many clients
6. Maintain the "New Client" button in the top-right

**Design considerations**:
- Use `shadcn/ui Table` component
- Add hover states for rows
- Include action buttons (edit, delete) in the last column
- Make it responsive (consider card view on mobile)

## Files to Investigate/Modify

1. **Client Creation API**:
   - `/app/api/teams/clients/route.ts` (POST handler)
   - Or `/app/api/clients/route.ts`

2. **Client Listing API**:
   - Same route as above (GET handler)

3. **Client Management Page**:
   - `/app/clients/page.tsx`
   - `/app/dashboard/clients/page.tsx`
   - Or search for "Client Management" heading

4. **Database Utilities**:
   - `/lib/db/utils.ts` - already has `createDefaultStages()` function

## Testing Checklist

After implementation:

- [ ] Create a new client and verify 5 default stages are created
- [ ] Navigate to the new client's dashboard and verify all 5 stages are visible
- [ ] Verify the client management page shows all clients with `isClient: true`
- [ ] Verify "Content Reach Team" (agency team) does NOT appear in client management
- [ ] Test table sorting functionality
- [ ] Test search functionality with the new table layout
- [ ] Test "New Client" button still works
- [ ] Verify table is responsive on different screen sizes
- [ ] Create a test card and verify the client dropdown shows all clients (including the new one with stages)

## MVP Approach

**Phase 1** (Critical - Fix broken functionality):
- Fix default stage creation for new clients

**Phase 2** (Enhancement - Better UX):
- Migrate to table layout for client management

## Questions to Clarify

1. Should "Content Reach Team" appear in the client dropdown when creating cards?
   - Current behavior: Likely not showing because it's not marked as `isClient: true`
   - Recommended: Keep it as an agency team, not a client

2. Should we allow editing/deleting clients from the management page?
   - If yes, need to add those API routes and UI

3. What should happen to existing cards when a client is deleted?
   - Set `clientId` to NULL?
   - Prevent deletion if client has cards?
