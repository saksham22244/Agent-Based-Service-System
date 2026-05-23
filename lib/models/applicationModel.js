import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';

const APPLICATIONS_COLLECTION = 'applications';

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
