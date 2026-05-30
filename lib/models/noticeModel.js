import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';

const NOTICES_COLLECTION = 'notices';

export const noticeDb = {
  // Get all notices with filtering and pagination
  getAll: async (filters = {}, pagination = {}) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const { page = 1, limit = 50 } = pagination;
      const { recipientType, status, search, senderId, originalNoticeId } = filters;

      // Build query
      const query = {};
      if (recipientType) query.recipientType = recipientType;
      if (status) query.status = status;
      if (senderId) query.senderId = senderId;
      if (originalNoticeId) query.originalNoticeId = originalNoticeId;
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

      const doc = await noticesCollection.findOneAndUpdate(
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
      console.error('Error updating notice:', error);
      throw error;
    }
  },

  // Mark notice as read
  markAsRead: async (id) => {
    try {
      const db = await getDb();
      const noticesCollection = db.collection(NOTICES_COLLECTION);

      const doc = await noticesCollection.findOneAndUpdate(
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

      if (!doc) return null;
      return {
        ...doc,
        id: doc._id.toString(),
        _id: undefined,
      };
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
