import { MongoClient } from 'mongodb';

const DB_NAME = process.env.MONGODB_DB_NAME || 'finalyearproject';

async function fixDb() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://saksham:saksham22@final.898x4.mongodb.net/?retryWrites=true&w=majority&appName=final";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const agents = await db.collection('agents').find({}).toArray();
    const transactions = await db.collection('transactions').find({ type: 'direct_payment', status: 'COMPLETE' }).toArray();

    console.log(`Found ${agents.length} agents and ${transactions.length} direct payments.`);

    let updatedAgents = 0;

    for (let agent of agents) {
      const agentId = agent._id.toString();
      const agentPayments = transactions.filter(t => t.userId === agentId);
      
      const totalPaid = agentPayments.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      if (totalPaid > 0 || agent.totalPaid === undefined) {
        await db.collection('agents').updateOne(
          { _id: agent._id },
          { $set: { totalPaid: totalPaid } }
        );
        console.log(`Agent ${agent.name} (${agent.email}): set totalPaid to Rs. ${totalPaid}`);
        updatedAgents++;
      }
    }

    console.log(`Finished updating ${updatedAgents} agents.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixDb();
