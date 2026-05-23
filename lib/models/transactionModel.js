import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';

const TRANSACTIONS_COLLECTION = 'transactions';

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

      const doc = await transactionsCollection.findOneAndUpdate(
        { product_id },
        {
          $set: {
            status,
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
