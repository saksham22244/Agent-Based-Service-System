import { ObjectId } from 'mongodb';
import { getDb } from './dbHelper';

const SERVICES_COLLECTION = 'services';

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

  getByName: async (name) => {
    try {
      const db = await getDb();
      const servicesCollection = db.collection(SERVICES_COLLECTION);
      // Case-insensitive match against the raw name (before formatting)
      const service = await servicesCollection.findOne({
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') },
      });
      if (service) {
        return {
          ...service,
          id: service._id.toString(),
          _id: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching service by name:', error);
      return null;
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

      const doc = await servicesCollection.findOneAndUpdate(
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
