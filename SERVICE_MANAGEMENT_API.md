# Service Management API Documentation

This document describes the service management and user-service assignment API endpoints for the Agent Based Service System.

## Base URL
All service endpoints are prefixed with `/api/admin/services` or `/api/admin/users/[id]/services`

---

## 🎯 Service Management

### GET `/api/admin/services`
Get all services with filtering and pagination.

**Query Parameters:**
- `search` (string, optional): Search by name or description
- `active` (boolean, optional): Filter by active status
- `page` (number, default: 1): Page number
- `limit` (number, default: 50): Items per page

**Example:**
```
GET /api/admin/services?search=birth&active=true&page=1&limit=20
```

**Response:**
```json
{
  "services": [
    {
      "id": "service_id",
      "name": "BIRTH\nCERTIFICATE",
      "icon": "📋",
      "color": "bg-blue-50",
      "borderColor": "border-blue-200",
      "description": "Service description",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

### POST `/api/admin/services`
Create a new service.

**Request Body:**
```json
{
  "name": "Birth Certificate",
  "icon": "📋",
  "color": "bg-blue-50",
  "borderColor": "border-blue-200",
  "description": "Service for birth certificate applications",
  "active": true
}
```

**Note:** The name will be automatically formatted to uppercase and split into multiple lines if it contains multiple words.

**Response:**
```json
{
  "id": "service_id",
  "name": "BIRTH\nCERTIFICATE",
  "icon": "📋",
  "color": "bg-blue-50",
  "borderColor": "border-blue-200",
  "description": "Service for birth certificate applications",
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/admin/services/[id]`
Get a specific service by ID.

**Response:**
```json
{
  "id": "service_id",
  "name": "BIRTH\nCERTIFICATE",
  "icon": "📋",
  "color": "bg-blue-50",
  "borderColor": "border-blue-200",
  "description": "Service description",
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH `/api/admin/services/[id]`
Update a service.

**Request Body:**
```json
{
  "name": "Updated Service Name",
  "icon": "📝",
  "color": "bg-green-50",
  "borderColor": "border-green-200",
  "description": "Updated description",
  "active": false
}
```

**Note:** All fields are optional. Only provided fields will be updated.

### DELETE `/api/admin/services/[id]`
Delete a service.

**Response:**
```json
{
  "message": "Service deleted successfully"
}
```

---

## 👥 User-Service Assignments

### GET `/api/admin/users/[id]/services`
Get all services assigned to a specific user.

**Response:**
```json
{
  "userId": "user_id",
  "userName": "John Doe",
  "count": 3,
  "services": [
    {
      "id": "assignment_id",
      "userId": "user_id",
      "serviceId": "service_id",
      "service": {
        "id": "service_id",
        "name": "BIRTH\nCERTIFICATE",
        "icon": "📋",
        "color": "bg-blue-50",
        "borderColor": "border-blue-200",
        "active": true
      },
      "assignedAt": "2024-01-01T00:00:00.000Z",
      "assignedBy": "admin",
      "status": "active"
    }
  ]
}
```

### POST `/api/admin/users/[id]/services`
Assign services to a user.

**Request Body (Single Service):**
```json
{
  "serviceId": "service_id"
}
```

**Request Body (Multiple Services):**
```json
{
  "serviceIds": ["service_id_1", "service_id_2", "service_id_3"]
}
```

**Response:**
```json
{
  "message": "Services assigned successfully",
  "userId": "user_id",
  "assigned": 3,
  "skipped": 0
}
```

**Note:** If a service is already assigned to the user, it will be skipped (not counted in `assigned`).

### DELETE `/api/admin/users/[id]/services?serviceId=[service_id]`
Remove a service from a user.

**Query Parameters:**
- `serviceId` (string, required): The service ID to remove

**Response:**
```json
{
  "message": "Service removed from user successfully",
  "userId": "user_id",
  "serviceId": "service_id"
}
```

---

## 🔄 Service-User Relationships

### GET `/api/admin/services/[id]/users`
Get all users assigned to a specific service.

**Response:**
```json
{
  "serviceId": "service_id",
  "serviceName": "BIRTH\nCERTIFICATE",
  "count": 5,
  "users": [
    {
      "id": "assignment_id",
      "userId": "user_id",
      "serviceId": "service_id",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "1234567890",
        "address": "123 Main St",
        "verified": true
      },
      "assignedAt": "2024-01-01T00:00:00.000Z",
      "assignedBy": "admin",
      "status": "active"
    }
  ]
}
```

---

## ⚡ Bulk Operations

### POST `/api/admin/user-services/bulk`
Perform bulk assign/unassign operations.

**Request Body:**
```json
{
  "operation": "assign", // or "unassign"
  "userIds": ["user_id_1", "user_id_2", "user_id_3"],
  "serviceIds": ["service_id_1", "service_id_2"]
}
```

**Response:**
```json
{
  "message": "Bulk assign operation completed",
  "operation": "assign",
  "total": 6,
  "successCount": 5,
  "failedCount": 1,
  "results": {
    "success": [
      { "userId": "user_id_1", "serviceId": "service_id_1" },
      { "userId": "user_id_1", "serviceId": "service_id_2" }
    ],
    "failed": [
      {
        "userId": "user_id_2",
        "serviceId": "service_id_1",
        "error": "Service not found"
      }
    ]
  }
}
```

**Note:** This will assign/unassign all specified services to/from all specified users (cartesian product).

---

## 📊 Updated Statistics Endpoint

The `/api/admin/statistics` endpoint now includes service-related statistics:

```json
{
  "totalUsers": 50,
  "totalAgents": 25,
  "totalServices": 10,
  "activeServices": 8,
  "inactiveServices": 2,
  "totalServiceAssignments": 150,
  "usersWithServices": 45,
  "recentServices": [...]
}
```

---

## 🎨 Service Data Model

### Service Schema
```javascript
{
  _id: ObjectId,
  name: String,              // Display name (uppercase, may contain \n)
  icon: String,              // Emoji icon (e.g., "📋")
  color: String,             // Tailwind background color (e.g., "bg-blue-50")
  borderColor: String,       // Tailwind border color (e.g., "border-blue-200")
  description: String,       // Optional description
  active: Boolean,           // Service active status
  createdAt: Date,
  updatedAt: Date
}
```

### User-Service Assignment Schema
```javascript
{
  _id: ObjectId,
  userId: String,            // Reference to user ID
  serviceId: String,         // Reference to service ID
  assignedBy: String,       // Who assigned it (e.g., "admin")
  status: String,           // "active" or "inactive"
  assignedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Usage Examples

### Example 1: Create a Service
```javascript
const response = await fetch('/api/admin/services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Character Certificate',
    icon: '📜',
    color: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Service for character certificate applications'
  })
});
const service = await response.json();
```

### Example 2: Assign Services to User
```javascript
const response = await fetch(`/api/admin/users/${userId}/services`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceIds: ['service1', 'service2', 'service3']
  })
});
const result = await response.json();
console.log(`Assigned ${result.assigned} services`);
```

### Example 3: Get User's Services
```javascript
const response = await fetch(`/api/admin/users/${userId}/services`);
const { services, count } = await response.json();
console.log(`User has ${count} services assigned`);
```

### Example 4: Bulk Assign Services to Multiple Users
```javascript
const response = await fetch('/api/admin/user-services/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'assign',
    userIds: ['user1', 'user2', 'user3'],
    serviceIds: ['service1', 'service2']
  })
});
const result = await response.json();
console.log(`Successfully assigned: ${result.successCount}`);
```

### Example 5: Remove Service from User
```javascript
const response = await fetch(
  `/api/admin/users/${userId}/services?serviceId=${serviceId}`,
  { method: 'DELETE' }
);
```

### Example 6: Get All Users for a Service
```javascript
const response = await fetch(`/api/admin/services/${serviceId}/users`);
const { users, count } = await response.json();
console.log(`${count} users have this service`);
```

---

## 🔄 Integration with Frontend

### Update Service Page
The existing service page (`app/service/page.jsx`) can now:
1. Fetch services from API:
   ```javascript
   const response = await fetch('/api/admin/services');
   const { services } = await response.json();
   setServices(services);
   ```

2. Create services via API:
   ```javascript
   await fetch('/api/admin/services', {
     method: 'POST',
     body: JSON.stringify(newService)
   });
   ```

3. Delete services via API:
   ```javascript
   await fetch(`/api/admin/services/${serviceId}`, {
     method: 'DELETE'
   });
   ```

### User Dashboard Integration
Users can view their assigned services:
```javascript
const response = await fetch(`/api/admin/users/${userId}/services`);
const { services } = await response.json();
// Display services to user
```

---

## 📝 Notes

1. **Service Name Formatting:** Service names are automatically converted to uppercase and split into multiple lines if they contain multiple words (e.g., "Birth Certificate" becomes "BIRTH\nCERTIFICATE").

2. **Duplicate Prevention:** When assigning services, if a service is already assigned to a user, it will be skipped (not duplicated).

3. **Cascading Deletes:** Currently, deleting a service does NOT automatically remove user-service assignments. Consider implementing cleanup logic if needed.

4. **Status Management:** User-service assignments have a `status` field that can be used to temporarily disable assignments without deleting them.

5. **Bulk Operations:** Bulk operations process all combinations of users and services, so be careful with large arrays.

---

## ✅ Summary

The service management system provides:
- ✅ Full CRUD operations for services
- ✅ User-service assignment management
- ✅ Bulk assignment operations
- ✅ Service-user relationship queries
- ✅ Statistics integration
- ✅ Search and filtering
- ✅ Pagination support

All endpoints are ready to use and fully integrated with the existing admin backend!
