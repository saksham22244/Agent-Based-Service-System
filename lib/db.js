/**
 * NOTE ON DATA SCHEMAS:
 * This project uses the native MongoDB driver rather than an ODM like Mongoose.
 * Therefore, there are no strict Schema definition files. 
 * The data structures and fields for all collections are defined and managed 
 * manually within the database operation functions below (e.g., create, update).
 * 
 * The models have been split file-wise by collection/module for better maintainability.
 */

import { userDb, initializeSuperAdmin } from './models/userModel';
import { agentDb } from './models/agentModel';
import { serviceDb } from './models/serviceModel';
import { userServiceDb } from './models/userServiceModel';
import { otpDb } from './models/otpModel';
import { noticeDb } from './models/noticeModel';
import { applicationDb } from './models/applicationModel';
import { transactionDb } from './models/transactionModel';

// Initialize on first import
initializeSuperAdmin();

export {
  userDb,
  agentDb,
  serviceDb,
  userServiceDb,
  otpDb,
  noticeDb,
  applicationDb,
  transactionDb
};
