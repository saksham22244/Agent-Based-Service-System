import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod validation schemas for all write endpoints.
// All schemas use Zod's default strip behaviour — unknown keys are silently
// removed from the parsed output, preventing field injection attacks such as
// passing role: 'superadmin' in a user creation request.
// ---------------------------------------------------------------------------

export const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  password: z.string().optional(),
  // role is locked to 'user' — callers cannot escalate to admin/agent via this schema
  role: z.enum(['user']).optional(),
  verified: z.boolean().optional(),
});

export const AgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  paymentDetails: z.string().optional(),
  photoUrl: z.string().optional(),
  password: z.string().optional(),
  approved: z.boolean().optional(),
  totalEarnings: z.number().optional(),
  bio: z.string().optional(),
});

export const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  description: z.string().optional(),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  formFields: z.array(z.any()).optional(),
  active: z.boolean().optional(),
  approvalStatus: z.enum(['approved', 'pending', 'rejected']).optional(),
  color: z.string().optional(),
  borderColor: z.string().optional(),
});

export const NoticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  recipientType: z.enum(['user', 'agent', 'all']),
  recipientId: z.string().optional(),
  recipientName: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  read: z.boolean().optional(),
});

export const ApplicationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  formData: z.record(z.any()).optional(),
  status: z.string().optional(),
  paymentDetails: z.any().optional(),
  assignedAgentId: z.string().optional(),
});

export const TransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  product_id: z.string().min(1, 'Product ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['service_payment', 'direct_payment']).optional(),
  status: z.enum(['PENDING', 'COMPLETE', 'FAILED', 'REFUNDED']).optional(),
  note: z.string().optional(),
});

export const UserServiceAssignSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  assignedBy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helper: parse a request body with a schema and return either the clean data
// or a 400 NextResponse. Import NextResponse at call site.
// ---------------------------------------------------------------------------
export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: result.error.format(), data: null };
  }
  return { error: null, data: result.data };
}
