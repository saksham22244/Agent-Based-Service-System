# Admin Service API Documentation

This document describes the comprehensive admin backend API endpoints for managing users and agents in the Agent Based Service System.

## Base URL
All admin endpoints are prefixed with `/api/admin`

## Authentication
Currently, admin authentication is simplified for development. In production, implement proper JWT/session-based authentication.

---

## 📊 Statistics & Dashboard

### GET `/api/admin/statistics`
Get dashboard statistics for admin overview.

**Response:**
```json
{
  "totalUsers": 50,
  "totalAgents": 25,
  "verifiedUsers": 45,
  "unverifiedUsers": 5,
  "approvedAgents": 20,
  "pendingAgents": 5,
  "totalAccounts": 75,
  "recentUsers": [...],
  "recentAgents": [...]
}
```

---

## 👥 User Management

### GET `/api/admin/users`
Get all users with filtering and pagination.

**Query Parameters:**
- `search` (string, optional): Search by name, email, or phone
- `verified` (boolean, optional): Filter by verification status
- `page` (number, default: 1): Page number
- `limit` (number, default: 50): Items per page

**Example:**
```
GET /api/admin/users?search=john&verified=true&page=1&limit=20
```

**Response:**
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### POST `/api/admin/users`
Create a new user (admin can create users directly).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "address": "123 Main St",
  "password": "password123", // optional
  "role": "user", // optional, default: "user"
  "verified": true // optional, default: true for admin-created users
}
```

### GET `/api/admin/users/[id]`
Get a specific user by ID.

**Response:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "address": "123 Main St",
  "role": "user",
  "verified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH `/api/admin/users/[id]`
Update a user. Admin can update any user field.

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phoneNumber": "9876543210",
  "address": "456 New St",
  "verified": false,
  "password": "newpassword123" // optional, will be hashed
}
```

**Note:** Cannot modify super admin user.

### DELETE `/api/admin/users/[id]`
Delete a user.

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Note:** Cannot delete super admin user.

---

## 🎯 Agent Management

### GET `/api/admin/agents`
Get all agents with filtering and pagination.

**Query Parameters:**
- `search` (string, optional): Search by name, email, or phone
- `approved` (boolean, optional): Filter by approval status
- `page` (number, default: 1): Page number
- `limit` (number, default: 50): Items per page

**Example:**
```
GET /api/admin/agents?approved=false&page=1&limit=20
```

### POST `/api/admin/agents`
Create a new agent (admin can create agents directly).

**Request:** FormData (multipart/form-data)
- `name` (string, required)
- `email` (string, required)
- `phoneNumber` (string, required)
- `address` (string, required)
- `photo` (file, optional): Agent photo
- `approved` (boolean, optional): Default false

**Response:**
```json
{
  "id": "agent_id",
  "name": "Jane Agent",
  "email": "jane@example.com",
  "phoneNumber": "1234567890",
  "address": "789 Agent St",
  "photoUrl": "/uploads/agents/1234567890-photo.jpg",
  "approved": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/admin/agents/[id]`
Get a specific agent by ID.

### PATCH `/api/admin/agents/[id]`
Update an agent. Supports both JSON and FormData.

**JSON Request:**
```json
{
  "name": "Jane Updated",
  "email": "jane.updated@example.com",
  "phoneNumber": "9876543210",
  "address": "456 New Agent St",
  "approved": true
}
```

**FormData Request:** (for photo upload)
- All fields optional
- `photo` (file): New photo (replaces old one)

### DELETE `/api/admin/agents/[id]`
Delete an agent (also deletes associated photo file).

---

## 🔍 Search

### GET `/api/admin/search`
Search across users and agents.

**Query Parameters:**
- `q` (string, required): Search query
- `type` (string, optional): "all", "user", or "agent" (default: "all")
- `limit` (number, optional): Max results per type (default: 20)

**Example:**
```
GET /api/admin/search?q=john&type=all&limit=10
```

**Response:**
```json
{
  "query": "john",
  "type": "all",
  "totalResults": 5,
  "results": {
    "users": [...],
    "agents": [...]
  }
}
```

---

## ⚡ Bulk Operations

### POST `/api/admin/bulk`
Perform bulk operations on multiple users or agents.

**Request Body:**
```json
{
  "operation": "approve", // "approve", "verify", "unverify", "delete", "update"
  "type": "agent", // "user" or "agent"
  "ids": ["id1", "id2", "id3"],
  "data": {} // Required for "update" operation
}
```

**Supported Operations:**
- `approve`: Approve agents (agents only)
- `verify`: Verify users (users only)
- `unverify`: Unverify users (users only)
- `delete`: Delete users or agents
- `update`: Update with custom data (requires `data` field)

**Example - Bulk Approve Agents:**
```json
{
  "operation": "approve",
  "type": "agent",
  "ids": ["agent_id_1", "agent_id_2", "agent_id_3"]
}
```

**Example - Bulk Verify Users:**
```json
{
  "operation": "verify",
  "type": "user",
  "ids": ["user_id_1", "user_id_2"]
}
```

**Example - Bulk Update:**
```json
{
  "operation": "update",
  "type": "user",
  "ids": ["user_id_1", "user_id_2"],
  "data": {
    "verified": true,
    "role": "premium"
  }
}
```

**Response:**
```json
{
  "message": "Bulk operation completed",
  "operation": "approve",
  "type": "agent",
  "total": 3,
  "successCount": 2,
  "failedCount": 1,
  "results": {
    "success": ["agent_id_1", "agent_id_2"],
    "failed": [
      {
        "id": "agent_id_3",
        "error": "Not found"
      }
    ]
  }
}
```

---

## 🔐 Existing Endpoints

### POST `/api/admin/login`
Admin login endpoint (already exists).

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin@123"
}
```

---

## 📝 Notes

1. **Super Admin Protection:** The super admin user (admin@example.com) cannot be modified or deleted through these endpoints.

2. **Password Hashing:** Passwords are automatically hashed using bcrypt when provided.

3. **Photo Management:** Agent photos are stored in `/public/uploads/agents/` and are automatically deleted when an agent is deleted.

4. **Pagination:** All list endpoints support pagination with `page` and `limit` parameters.

5. **Search:** Search functionality is case-insensitive and searches across name, email, phone number, and address fields.

6. **Error Handling:** All endpoints return appropriate HTTP status codes:
   - `200`: Success
   - `201`: Created
   - `400`: Bad Request (validation errors)
   - `403`: Forbidden (unauthorized operations)
   - `404`: Not Found
   - `500`: Internal Server Error

---

## 🚀 Usage Examples

### Example 1: Get Dashboard Statistics
```javascript
const response = await fetch('/api/admin/statistics');
const stats = await response.json();
console.log(`Total Users: ${stats.totalUsers}`);
console.log(`Pending Agents: ${stats.pendingAgents}`);
```

### Example 2: Search for Users
```javascript
const response = await fetch('/api/admin/search?q=john&type=user');
const results = await response.json();
console.log(`Found ${results.totalResults} results`);
```

### Example 3: Approve Multiple Agents
```javascript
const response = await fetch('/api/admin/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'approve',
    type: 'agent',
    ids: ['agent1', 'agent2', 'agent3']
  })
});
const result = await response.json();
console.log(`Approved ${result.successCount} agents`);
```

### Example 4: Update User
```javascript
const response = await fetch('/api/admin/users/user_id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verified: true,
    name: 'Updated Name'
  })
});
const user = await response.json();
```

### Example 5: Create Agent with Photo
```javascript
const formData = new FormData();
formData.append('name', 'New Agent');
formData.append('email', 'agent@example.com');
formData.append('phoneNumber', '1234567890');
formData.append('address', '123 Agent St');
formData.append('photo', photoFile);
formData.append('approved', 'true');

const response = await fetch('/api/admin/agents', {
  method: 'POST',
  body: formData
});
const agent = await response.json();
```

---

## 🔄 Integration with Frontend

The admin dashboard (`/app/dashboard/page.jsx`) can now use these endpoints for:
- Real-time statistics display
- Advanced user/agent management
- Bulk operations for efficiency
- Advanced search capabilities
- User verification management
- Agent approval workflows

---

## 📋 Summary

The admin service backend provides comprehensive CRUD operations for:
- ✅ User management (create, read, update, delete)
- ✅ Agent management (create, read, update, delete)
- ✅ Statistics and analytics
- ✅ Search functionality
- ✅ Bulk operations
- ✅ User verification control
- ✅ Agent approval control
- ✅ Photo management for agents

All endpoints are designed to work seamlessly with the existing frontend dashboard.
