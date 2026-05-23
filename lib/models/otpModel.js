import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';

const OTP_COLLECTION = 'otps';
const RETRY_LIMIT = 3;

export const otpDb = {
  create: async (otpData) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_COLLECTION);

      const newOtp = {
        ...otpData,
        attempts: 0,                                          // retry counter
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),   // 10 minutes expiry
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
        expiresAt: { $gt: new Date() },
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

  /**
   * Atomically increments the attempts counter on a non-expired OTP record.
   * Returns the updated record (with the new attempts value), or null if not found/expired.
   */
  incrementAttempts: async (userId, purpose) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_COLLECTION);

      const doc = await otpCollection.findOneAndUpdate(
        { userId, purpose, expiresAt: { $gt: new Date() } },
        { $inc: { attempts: 1 } },
        { returnDocument: 'after' }
      );

      if (!doc) return null;
      return {
        ...doc,
        id: doc._id.toString(),
        _id: undefined,
      };
    } catch (error) {
      console.error('Error incrementing OTP attempts:', error);
      return null;
    }
  },

  delete: async (userId, purpose) => {
    try {
      const db = await getDb();
      const otpCollection = db.collection(OTP_COLLECTION);
      const result = await otpCollection.deleteMany({ userId, purpose });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting OTP:', error);
      return false;
    }
  },

  RETRY_LIMIT,
};
