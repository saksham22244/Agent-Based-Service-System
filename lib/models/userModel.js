import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';
import bcrypt from 'bcrypt';


const USERS_COLLECTION = 'users';

export async function initializeSuperAdmin() {
  try {
    const db = await getDb();
    const usersCollection = db.collection(USERS_COLLECTION);

    const superAdmin = await usersCollection.findOne({ email: 'admin@example.com' });

    // Idempotency guard — skip bcrypt entirely if password already set
    if (superAdmin?.password) return;

    // Hash exactly once per invocation
    const rawPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

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
    } else {
      // Record exists but has no password — set it
      await usersCollection.updateOne(
        { _id: superAdmin._id },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      console.log('Super admin password set/updated');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
}


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

      const doc = await usersCollection.findOneAndUpdate(
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
