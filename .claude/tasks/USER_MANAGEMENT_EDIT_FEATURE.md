# User Management Edit Feature - Implementation Task

**Created**: October 3, 2025
**Status**: 🔴 **NOT IMPLEMENTED** - Critical Gap
**Priority**: HIGH - Admin cannot edit user records
**Issue**: 404 error when clicking "Edit" button on users page

---

## 📋 **Problem Statement**

### **Current State**
- ✅ User management list page exists at `/dashboard/users`
- ✅ Displays all 6 users with roles (Admin, Strategist, Scriptwriter, Editor, Coordinator)
- ✅ "Edit" button visible on each user row
- ❌ **Clicking "Edit" navigates to `/dashboard/users/[userId]` which returns 404**
- ❌ No edit page/route implemented
- ❌ No user update API endpoint

### **Expected Behavior**
When admin clicks "Edit" button:
1. Should navigate to `/dashboard/users/[userId]` edit page
2. Display user details in editable form
3. Allow updating: firstName, lastName, email, role
4. Save changes via API endpoint
5. Return to users list with success message

---

## 🎯 **Implementation Requirements**

### **1. Create User Edit Page**
**File**: `/frontend/src/app/dashboard/users/[userId]/page.tsx`

**Features Required**:
- [x] Route parameter handling: `[userId]` dynamic route
- [ ] Fetch user data on page load
- [ ] Form fields:
  - First Name (text input)
  - Last Name (text input)
  - Email (email input, with validation)
  - Role (dropdown: admin, strategist, scriptwriter, editor, coordinator, member, client)
- [ ] Form validation:
  - Required fields: firstName, lastName, email, role
  - Email format validation
  - Unique email check (if changed)
- [ ] Save button with loading state
- [ ] Cancel button (navigate back to users list)
- [ ] Delete user button (optional, with confirmation)
- [ ] Admin-only access control
- [ ] Error handling and toast notifications

### **2. Create User Update API Endpoint**
**File**: `/frontend/src/app/api/users/[userId]/route.ts`

**Methods Required**:

#### **GET /api/users/[userId]**
- Fetch single user by ID
- Return: `{ id, email, firstName, lastName, role, createdAt }`
- Permission: Admin only
- Error handling: 404 if user not found

#### **PUT /api/users/[userId]**
- Update user fields
- Request body: `{ firstName?, lastName?, email?, role? }`
- Validation:
  - Email uniqueness check (if changed)
  - Valid role enum value
  - Cannot change own role to non-admin (prevent lockout)
- Permission: Admin only
- Return updated user object
- Audit log: Record user update in audit_logs table

#### **DELETE /api/users/[userId]** (Optional)
- Soft delete or hard delete user
- Validation: Cannot delete self
- Validation: Cannot delete last admin
- Permission: Admin only
- Audit log: Record user deletion

### **3. API Client Integration**
**File**: `/frontend/src/lib/api-client.ts`

Add methods:
```typescript
async getUserById(userId: string): Promise<User>
async updateUser(userId: string, data: UpdateUserDto): Promise<User>
async deleteUser(userId: string): Promise<void>
```

### **4. Form Components** (Optional - if reusable)
**File**: `/frontend/src/components/users/UserEditForm.tsx`

Reusable form component for editing user details.

---

## 🛠️ **Technical Implementation Plan**

### **Phase 1: API Endpoints** (1-1.5 hours)

#### **Step 1.1: Create GET endpoint**
```typescript
// /frontend/src/app/api/users/[userId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId } = await params
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}
```

#### **Step 1.2: Create PUT endpoint**
```typescript
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId } = await params
  const body = await request.json()

  // Validation
  const updateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'strategist', 'scriptwriter', 'editor', 'coordinator', 'member', 'client']).optional(),
  })

  const validatedData = updateSchema.parse(body)

  // Check email uniqueness if changed
  if (validatedData.email) {
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, validatedData.email),
        not(eq(users.id, userId))
      ),
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }
  }

  // Update user
  const [updatedUser] = await db
    .update(users)
    .set({
      ...validatedData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  return NextResponse.json(updatedUser)
}
```

### **Phase 2: Edit Page UI** (1.5-2 hours)

#### **Step 2.1: Create dynamic route page**
```typescript
// /frontend/src/app/dashboard/users/[userId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  })

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchUser()
  }, [params.userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.userId}`)
      if (!response.ok) throw new Error('User not found')
      const data = await response.json()
      setUser(data)
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      })
    } catch (error) {
      toast.error('Failed to load user')
      router.push('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/users/${params.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update user')

      toast.success('User updated successfully')
      router.push('/dashboard/users')
    } catch (error) {
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  // Form JSX implementation...
}
```

### **Phase 3: Testing** (30 minutes)

- [ ] Test GET /api/users/[userId] endpoint
- [ ] Test PUT /api/users/[userId] endpoint
- [ ] Test edit page UI loads correctly
- [ ] Test form validation (required fields, email format)
- [ ] Test email uniqueness validation
- [ ] Test role update functionality
- [ ] Test cancel button navigation
- [ ] Test with different user roles (only admin should access)
- [ ] Test updating own user record
- [ ] Test error handling (404, 403, validation errors)

---

## 📊 **Acceptance Criteria**

- [ ] Admin can click "Edit" on any user row
- [ ] Edit page loads at `/dashboard/users/[userId]` without 404
- [ ] Form displays current user data
- [ ] Admin can update firstName, lastName, email, role
- [ ] Email validation prevents invalid formats
- [ ] Email uniqueness validation prevents duplicates
- [ ] Role dropdown shows all 7 roles
- [ ] Save button updates user and shows success toast
- [ ] Cancel button returns to users list without saving
- [ ] Non-admin users cannot access edit page (403 redirect)
- [ ] Audit log records user updates

---

## 🔧 **Files to Create/Modify**

### **New Files (2)**
1. `/frontend/src/app/dashboard/users/[userId]/page.tsx` - Edit user page
2. `/frontend/src/app/api/users/[userId]/route.ts` - User CRUD API

### **Modified Files (1)**
3. `/frontend/src/lib/api-client.ts` - Add user update methods (optional)

---

## 📝 **Additional Enhancements** (Optional)

### **Password Reset Feature**
- [ ] "Reset Password" button on edit page
- [ ] Generates temporary password or sends reset email
- [ ] Admin can force password change on next login

### **User Deactivation**
- [ ] `isActive` boolean field in database
- [ ] Toggle active/inactive status
- [ ] Inactive users cannot log in

### **User Activity Log**
- [ ] Show last login timestamp
- [ ] Show recent actions (from audit logs)
- [ ] Filter audit logs by user

### **Bulk Actions**
- [ ] Select multiple users
- [ ] Bulk role assignment
- [ ] Bulk deactivation/activation

---

## 🚀 **Next Steps**

1. **Implement API endpoints first** (Phase 1)
2. **Create edit page UI** (Phase 2)
3. **Test end-to-end** (Phase 3)
4. **Document in roadmap** (update IMPLEMENTATION_ROADMAP.md)

---

**Estimated Time**: 3-4 hours total
**Priority**: HIGH - Blocking admin user management workflows
**Blocker**: No way for admin to update user information currently
