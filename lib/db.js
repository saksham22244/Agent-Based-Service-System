import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = process.env.MONGODB_DB_NAME || 'finalyearproject';
const USERS_COLLECTION = 'users';
const AGENTS_COLLECTION = 'agents';
const OTP_VERIFICATION_COLLECTION = 'otp_verifications';

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
    
    if (!superAdmin) {
      await usersCollection.insertOne({
        name: 'Super Admin',
        email: 'admin@example.com',
        phoneNumber: '1234567890',
        address: 'Admin Address',
        role: 'superadmin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Super admin user initialized');
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
      
      const newUser = {
        ...userData,
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
      
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date(),
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return null;
      }
      
      return await userDb.getById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  updateByEmail: async (email, updateData) => {
    try {
      const db = await getDb();
      const usersCollection = db.collection(USERS_COLLECTION);
      
      const result = await usersCollection.updateOne(
        { email },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date(),
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return null;
      }
      
      return await userDb.getByEmail(email);
    } catch (error) {
      console.error('Error updating user by email:', error);
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
      
      const newAgent = {
        ...agentData,
        approved: false, // Agents need approval before they can login
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
      
      const result = await agentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date(),
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return null;
      }
      
      return await agentDb.getById(id);
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

// OTP Verification operations
export const otpDb = {
  create: async (otpData) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_VERIFICATION_COLLECTION);
      
      const newOtp = {
        userId: new ObjectId(otpData.userId),
        otp: otpData.otp, // Hashed OTP
        purpose: otpData.purpose || 'registration',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
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

  findByUserId: async (userId, purpose = 'registration') => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_VERIFICATION_COLLECTION);
      
      const otp = await otpCollection.findOne({
        userId: new ObjectId(userId),
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

  delete: async (userId, purpose = 'registration') => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_VERIFICATION_COLLECTION);
      const result = await otpCollection.deleteMany({
        userId: new ObjectId(userId),
        purpose,
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting OTP:', error);
      return false;
    }
  },

  deleteExpired: async () => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_VERIFICATION_COLLECTION);
      const result = await otpCollection.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting expired OTPs:', error);
      return 0;
    }
  },
};
