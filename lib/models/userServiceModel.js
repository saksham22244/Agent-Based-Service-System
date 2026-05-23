import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';
const SERVICES_COLLECTION = 'services';
const USERS_COLLECTION = 'users';

const USER_SERVICES_COLLECTION = 'user_services';

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
