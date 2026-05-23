import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';

const AGENTS_COLLECTION = 'agents';

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

      const doc = await agentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (!doc) return null;
      return {
        ...doc,
        id: doc._id.toString(),
        _id: undefined,
      };
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
