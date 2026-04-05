/**
 * NOTE ON DATA SCHEMAS:
 * This project uses the native MongoDB driver rather than an ODM like Mongoose.
 * Therefore, there are no strict Schema definition files. 
 * The data structures and fields for all collections are defined and managed 
 * manually within the database operation functions below (e.g., create, update).
 */
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const DB_NAME = process.env.MONGODB_DB_NAME || 'finalyearproject';
const USERS_COLLECTION = 'users';
const AGENTS_COLLECTION = 'agents';
const SERVICES_COLLECTION = 'services';
const USER_SERVICES_COLLECTION = 'user_services';
const OTP_COLLECTION = 'otps';
const NOTICES_COLLECTION = 'notices';
const APPLICATIONS_COLLECTION = 'applications';
const TRANSACTIONS_COLLECTION = 'transactions';

// Helper function to get database
async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

// Initialize super admin user if it doesn't exist
async function initializeSuperAdmin() {
  try {
    const db = await getDb();
    const usersCollection = db.collection(USERS_COLLECTION);

    const superAdmin = await usersCollection.findOne({ email: 'admin@example.com' });

    // Fixed admin password (hashed)
    const fixedAdminPassword = 'admin@123';
    const hashedPassword = await bcrypt.hash(fixedAdminPassword, 10);

    if (!superAdmin) {
      await usersCollection.insertOne({
        name: 'Super Admin',
        email: 'admin@example.com',
        phoneNumber: '1234567890',
        address: 'Admin Address',
        role: 'superadmin',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Super admin user initialized');
    } else if (!superAdmin.password) {
      // If super admin exists but has no password, set the fixed password
      await usersCollection.updateOne(
        { _id: superAdmin._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );
      console.log('Super admin password set/updated');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
}

// Initialize on first import
initializeSuperAdmin();

// User operations
export const userDb = {
  getAll: async () => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);
      const users = await usersCollection.find({}).toArray();
      // Convert _id to id for compatibility
      return users.map(user => ({
        ...user,
        id: user._id.toString(),
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (user) {
        return {
          ...user,
          id: user._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }
  },

  getByEmail: async (email) => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);
      const user = await usersCollection.findOne({ email });
      if (user) {
        return {
          ...user,
          id: user._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  },

  create: async (userData) => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);

      // USER SCHEMA DEFINITION: 
      // This defines the structure for all users (Admins, Users, Agents).
      const newUser = {
        ...userData, // Includes: name, email, password, role, etc.
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);

      return {
        ...newUser,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (result && typeof result === 'object') {
        const doc = result.value || result;
        if (doc._id) {
          return {
            ...doc,
            id: doc._id.toString(),
            _id: undefined,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },
};

// Agent operations
export const agentDb = {
  getAll: async () => {
    try {
      const db = await getDb();
      const agentsCollection = db.collection(AGENTS_COLLECTION);
      const agents = await agentsCollection.find({}).toArray();
      // Convert _id to id for compatibility
      return agents.map(agent => ({
        ...agent,
        id: agent._id.toString(),
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const db = await getDb();
      const agentsCollection = db.collection(AGENTS_COLLECTION);
      const agent = await agentsCollection.findOne({ _id: new ObjectId(id) });
      if (agent) {
        return {
          ...agent,
          id: agent._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching agent by id:', error);
      return null;
    }
  },

  getByEmail: async (email) => {
    try {
      const db = await getDb();
      const agentsCollection = db.collection(AGENTS_COLLECTION);
      const agent = await agentsCollection.findOne({ email });
      if (agent) {
        return {
          ...agent,
          id: agent._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching agent by email:', error);
      return null;
    }
  },

  create: async (agentData) => {
    try {
      const db = await getDb();
      const agentsCollection = db.collection(AGENTS_COLLECTION);

      // AGENT SCHEMA DEFINITION:
      // Includes specific agent metadata like approval state and earnings.
      const newAgent = {
        ...agentData, // Includes: credentials, esewaDetails, bio, totalEarnings
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await agentsCollection.insertOne(newAgent);

      return {
        ...newAgent,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      const db = await getDb();
      const agentsCollection = db.collection(AGENTS_COLLECTION);

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await agentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (result && typeof result === 'object') {
        const doc = result.value || result;
        if (doc._id) {
          return {
            ...doc,
            id: doc._id.toString(),
            _id: undefined,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const db = await getDb();
      const agentsCollection = db.collection(AGENTS_COLLECTION);
      const result = await agentsCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  },
};

// Service operations
export const serviceDb = {
  getAll: async () => {
    try {
      const db = await getDb();
      const servicesCollection = db.collection(SERVICES_COLLECTION);
      const services = await servicesCollection.find({}).toArray();
      return services.map(service => ({
        ...service,
        id: service._id.toString(),
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const db = await getDb();
      const servicesCollection = db.collection(SERVICES_COLLECTION);
      const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
      if (service) {
        return {
          ...service,
          id: service._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching service by id:', error);
      return null;
    }
  },

  create: async (serviceData) => {
    try {
      const db = await getDb();
      const servicesCollection = db.collection(SERVICES_COLLECTION);

      // SERVICE SCHEMA DEFINITION: 
      // This defines how a service is stored in the database.
      const newService = {
        ...serviceData, // Includes: name, price, description, icon, and formFields (Dynamic Form Template)
        active: serviceData.active !== undefined ? serviceData.active : true, // Controls visibility
        createdAt: new Date(), // Audit: Creation timestamp
        updatedAt: new Date(), // Audit: Last modification timestamp
        approvalStatus: serviceData.approvalStatus || 'approved' // Track Admin approval state
      };

      const result = await servicesCollection.insertOne(newService);

      return {
        ...newService,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      const db = await getDb();
      const servicesCollection = db.collection(SERVICES_COLLECTION);

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await servicesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (result && typeof result === 'object') {
        const doc = result.value || result;
        if (doc._id) {
          return {
            ...doc,
            id: doc._id.toString(),
            _id: undefined,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const db = await getDb();
      const servicesCollection = db.collection(SERVICES_COLLECTION);
      const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting service:', error);
      return false;
    }
  },
};

// User-Service association operations
export const userServiceDb = {
  // Get all services assigned to a user
  getByUserId: async (userId) => {
    try {
      const db = await getDb();
      const userServicesCollection = db.collection(USER_SERVICES_COLLECTION);
      const userServices = await userServicesCollection.find({ userId }).toArray();

      // Get service details for each assignment
      const serviceIds = userServices.map(us => new ObjectId(us.serviceId));
      const servicesCollection = db.collection(SERVICES_COLLECTION);
      const services = await servicesCollection.find({ _id: { $in: serviceIds } }).toArray();

      const serviceMap = {};
      services.forEach(service => {
        serviceMap[service._id.toString()] = {
          ...service,
          id: service._id.toString(),
          _id: undefined,
        };
      });

      return userServices.map(us => ({
        id: us._id.toString(),
        userId: us.userId,
        serviceId: us.serviceId,
        service: serviceMap[us.serviceId] || null,
        assignedAt: us.assignedAt,
        assignedBy: us.assignedBy,
        status: us.status || 'active',
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching user services:', error);
      return [];
    }
  },

  // Get all users assigned to a service
  getByServiceId: async (serviceId) => {
    try {
      const db = await getDb();
      const userServicesCollection = db.collection(USER_SERVICES_COLLECTION);
      const userServices = await userServicesCollection.find({ serviceId }).toArray();

      // Get user details for each assignment
      const userIds = userServices.map(us => new ObjectId(us.userId));
      const usersCollection = db.collection(USERS_COLLECTION);
      const users = await usersCollection.find({ _id: { $in: userIds } }).toArray();

      const userMap = {};
      users.forEach(user => {
        const { password, ...userWithoutPassword } = user;
        userMap[user._id.toString()] = {
          ...userWithoutPassword,
          id: user._id.toString(),
          _id: undefined,
        };
      });

      return userServices.map(us => ({
        id: us._id.toString(),
        userId: us.userId,
        serviceId: us.serviceId,
        user: userMap[us.userId] || null,
        assignedAt: us.assignedAt,
        assignedBy: us.assignedBy,
        status: us.status || 'active',
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching service users:', error);
      return [];
    }
  },

  // Assign a service to a user
  assign: async (userId, serviceId, assignedBy = 'admin') => {
    try {
      const db = await getDb();
      const userServicesCollection = db.collection(USER_SERVICES_COLLECTION);

      // Check if already assigned
      const existing = await userServicesCollection.findOne({
        userId,
        serviceId,
      });

      if (existing) {
        return {
          ...existing,
          id: existing._id.toString(),
          _id: undefined,
        };
      }

      // USER-SERVICE (TASK) SCHEMA DEFINITION:
      // Tracks service requests and their current status (active/complete).
      const assignment = {
        userId,       // The User requesting service
        serviceId,    // The specific service template ID 
        assignedBy,   // Tracks process flow (e.g., 'admin')
        status: 'active',
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await userServicesCollection.insertOne(assignment);

      return {
        ...assignment,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error assigning service to user:', error);
      throw error;
    }
  },

  // Remove a service from a user
  unassign: async (userId, serviceId) => {
    try {
      const db = await getDb();
      const userServicesCollection = db.collection(USER_SERVICES_COLLECTION);
      const result = await userServicesCollection.deleteOne({
        userId,
        serviceId,
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error unassigning service from user:', error);
      return false;
    }
  },

  // Bulk assign services to a user
  bulkAssign: async (userId, serviceIds, assignedBy = 'admin') => {
    try {
      const db = await getDb();
      const userServicesCollection = db.collection(USER_SERVICES_COLLECTION);

      // Get existing assignments
      const existing = await userServicesCollection.find({ userId }).toArray();
      const existingServiceIds = existing.map(e => e.serviceId);

      // Filter out already assigned services
      const newServiceIds = serviceIds.filter(id => !existingServiceIds.includes(id));

      if (newServiceIds.length === 0) {
        return { assigned: 0, skipped: serviceIds.length };
      }

      // Insert new assignments
      const assignments = newServiceIds.map(serviceId => ({
        userId,
        serviceId,
        assignedBy,
        status: 'active',
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await userServicesCollection.insertMany(assignments);

      return {
        assigned: result.insertedCount,
        skipped: serviceIds.length - newServiceIds.length,
      };
    } catch (error) {
      console.error('Error bulk assigning services:', error);
      throw error;
    }
  },

  // Update assignment status
  updateStatus: async (userId, serviceId, status) => {
    try {
      const db = await getDb();
      const userServicesCollection = db.collection(USER_SERVICES_COLLECTION);

      const result = await userServicesCollection.findOneAndUpdate(
        { userId, serviceId },
        {
          $set: {
            status,
            updatedAt: new Date(),
          }
        },
        { returnDocument: 'after' }
      );

      if (result && typeof result === 'object') {
        const doc = result.value || result;
        if (doc._id) {
          return {
            ...doc,
            id: doc._id.toString(),
            _id: undefined,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating assignment status:', error);
      throw error;
    }
  },
};

// OTP operations
export const otpDb = {
  create: async (otpData) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_COLLECTION);

      const newOtp = {
        ...otpData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      };

      const result = await otpCollection.insertOne(newOtp);

      return {
        ...newOtp,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw error;
    }
  },

  findByUserId: async (userId, purpose) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_COLLECTION);
      const otp = await otpCollection.findOne({
        userId,
        purpose,
        expiresAt: { $gt: new Date() }, // Only get non-expired OTPs
      });

      if (otp) {
        return {
          ...otp,
          id: otp._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding OTP:', error);
      return null;
    }
  },

  delete: async (userId, purpose) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_COLLECTION);
      const result = await otpCollection.deleteMany({
        userId,
        purpose,
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting OTP:', error);
      return false;
    }
  },
};

// Notice operations
export const noticeDb = {
  // Get all notices with filtering and pagination
  getAll: async (filters = {}, pagination = {}) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const { page = 1, limit = 50 } = pagination;
      const { recipientType, status, search } = filters;

      // Build query
      const query = {};
      if (recipientType) query.recipientType = recipientType;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
          { recipientName: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const notices = await noticesCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await noticesCollection.countDocuments(query);

      return {
        notices: notices.map(notice => ({
          ...notice,
          id: notice._id.toString(),
          _id: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching notices:', error);
      return { notices: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  // Get notice by ID
  getById: async (id) => {
    try {
      console.log('noticeDb.getById called with ID:', id);
      console.log('ID type:', typeof id);

      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      let objectId;
      try {
        objectId = new ObjectId(id);
        console.log('Valid ObjectId created:', objectId);
      } catch (error) {
        console.error('Invalid ObjectId format:', error);
        return null;
      }

      const notice = await noticesCollection.findOne({ _id: objectId });
      console.log('MongoDB query result:', notice);

      if (notice) {
        return {
          ...notice,
          id: notice._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching notice by id:', error);
      return null;
    }
  },

  // Get notices for a specific user or agent
  getByRecipientId: async (recipientId, pagination = {}) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const notices = await noticesCollection
        .find({ recipientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await noticesCollection.countDocuments({ recipientId });

      return {
        notices: notices.map(notice => ({
          ...notice,
          id: notice._id.toString(),
          _id: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching recipient notices:', error);
      return { notices: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  },

  // Create a new notice
  create: async (noticeData) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const newNotice = {
        ...noticeData,
        status: noticeData.status || 'active',
        read: noticeData.read || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await noticesCollection.insertOne(newNotice);

      return {
        ...newNotice,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating notice:', error);
      throw error;
    }
  },

  // Update notice
  update: async (id, updateData) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await noticesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (result.value) {
        return {
          ...result.value,
          id: result.value._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error updating notice:', error);
      throw error;
    }
  },

  // Mark notice as read
  markAsRead: async (id) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const result = await noticesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            read: true,
            readAt: new Date(),
            updatedAt: new Date(),
          }
        },
        { returnDocument: 'after' }
      );

      if (result.value) {
        return {
          ...result.value,
          id: result.value._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error marking notice as read:', error);
      throw error;
    }
  },

  // Delete notice
  delete: async (id) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);
      const result = await noticesCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting notice:', error);
      return false;
    }
  },

  // Bulk operations
  bulkUpdate: async (ids, updateData) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const objectIds = ids.map(id => new ObjectId(id));

      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await noticesCollection.updateMany(
        { _id: { $in: objectIds } },
        { $set: updateFields }
      );

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      console.error('Error bulk updating notices:', error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const [
        total,
        active,
        inactive,
        read,
        unread,
        userNotices,
        agentNotices
      ] = await Promise.all([
        noticesCollection.countDocuments(),
        noticesCollection.countDocuments({ status: 'active' }),
        noticesCollection.countDocuments({ status: 'inactive' }),
        noticesCollection.countDocuments({ read: true }),
        noticesCollection.countDocuments({ read: false }),
        noticesCollection.countDocuments({ recipientType: 'user' }),
        noticesCollection.countDocuments({ recipientType: 'agent' })
      ]);

      return {
        total,
        active,
        inactive,
        read,
        unread,
        userNotices,
        agentNotices
      };
    } catch (error) {
      console.error('Error fetching notice statistics:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        read: 0,
        unread: 0,
        userNotices: 0,
        agentNotices: 0
      };
    }
  },
};

// Application operations
export const applicationDb = {
  getAll: async () => {
    try {
      const db = await getDb();
      const applications = await db.collection(APPLICATIONS_COLLECTION).find({}).toArray();
      return applications.map(app => ({
        ...app,
        id: app._id.toString(),
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const db = await getDb();
      const app = await db.collection(APPLICATIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
      if (app) {
        return {
          ...app,
          id: app._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching application by id:', error);
      return null;
    }
  },

  getByUserId: async (userId) => {
    try {
      const db = await getDb();
      const applications = await db.collection(APPLICATIONS_COLLECTION).find({ userId }).toArray();
      return applications.map(app => ({
        ...app,
        id: app._id.toString(),
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching applications by user ID:', error);
      return [];
    }
  },

  getByAgentId: async (agentId) => {
    try {
      const db = await getDb();
      const applications = await db.collection(APPLICATIONS_COLLECTION).find({
        $or: [
          { assignedAgentId: agentId },
          { assignedAgentId: null }
        ]
      }).toArray();
      return applications.map(app => ({
        ...app,
        id: app._id.toString(),
        _id: undefined,
      }));
    } catch (error) {
      console.error('Error fetching applications by agent ID:', error);
      return [];
    }
  },

  create: async (data) => {
    try {
      const db = await getDb();
      const newApp = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection(APPLICATIONS_COLLECTION).insertOne(newApp);
      return {
        ...newApp,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  update: async (id, updateData) => {
    try {
      const db = await getDb();
      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      const result = await db.collection(APPLICATIONS_COLLECTION).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (result) {
        return {
          ...result,
          id: result._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error updating application:', error);
      return null;
    }
  },

  delete: async (id) => {
    try {
      const db = await getDb();
      const result = await db.collection(APPLICATIONS_COLLECTION).deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  },
};

// Transaction operations
export const transactionDb = {
  create: async (transactionData) => {
    try {
      const db = await getDb();
      const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);

      // ESEWA TRANSACTION SCHEMA DEFINITION:
      // This tracks all financial movements, including amount, product IDs, 
      // and current payment status (PENDING, COMPLETE, FAILED).
      const newTransaction = {
        ...transactionData, // Includes: amount, product_id, userId, type (service_payment/direct_payment)
        status: transactionData.status || 'PENDING', // Initial status is always PENDING
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await transactionsCollection.insertOne(newTransaction);

      return {
        ...newTransaction,
        id: result.insertedId.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  getAll: async () => {
    try {
      const db = await getDb();
      const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);
      const transactions = await transactionsCollection.find({}).toArray();

      return {
        transactions: transactions.map(transaction => ({
          ...transaction,
          id: transaction._id?.toString() || transaction.id,
          _id: undefined,
        }))
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  getByProductId: async (product_id) => {
    try {
      const db = await getDb();
      const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);
      const transaction = await transactionsCollection.findOne({ product_id });

      if (transaction) {
        return {
          ...transaction,
          id: transaction._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  },

  updateStatus: async (product_id, status) => {
    try {
      const db = await getDb();
      const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);

      const result = await transactionsCollection.findOneAndUpdate(
        { product_id },
        {
          $set: {
            status,
            updatedAt: new Date(),
          }
        },
        { returnDocument: 'after' }
      );

      if (result && typeof result === 'object') {
        const doc = result.value || result;
        if (doc._id) {
          return {
            ...doc,
            id: doc._id.toString(),
            _id: undefined,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  },

  getRecentCompleteByUser: async (userId) => {
    try {
      const db = await getDb();
      const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);

      const transactions = await transactionsCollection
        .find({ userId, status: 'COMPLETE' })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

      if (transactions.length > 0) {
        return {
          ...transactions[0],
          id: transactions[0]._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching recent user transaction:', error);
      return null;
    }
  }
};
