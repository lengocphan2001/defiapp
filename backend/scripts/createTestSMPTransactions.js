const { pool } = require('../config/database');
const SMPTransaction = require('../models/SMPTransaction');

async function createTestSMPTransactions() {
  try {
    console.log('Creating test SMP transactions...');
    
    // Ensure table exists
    await SMPTransaction.ensureTableExists();
    
    // Create some test transactions
    const testTransactions = [
      {
        from_user_id: 1,
        to_user_id: 2,
        amount: 100.0,
        transaction_type: 'nft_payment',
        description: 'Payment for NFT #123',
        reference_id: '123',
        reference_type: 'nft_transaction',
        status: 'completed'
      },
      {
        from_user_id: 2,
        to_user_id: 1,
        amount: 50.0,
        transaction_type: 'nft_sale',
        description: 'Sale of NFT #456',
        reference_id: '456',
        reference_type: 'nft_transaction',
        status: 'completed'
      },
      {
        from_user_id: null,
        to_user_id: 1,
        amount: 200.0,
        transaction_type: 'deposit',
        description: 'Deposit of 200 SMP',
        reference_id: 'deposit_001',
        reference_type: 'deposit_request',
        status: 'completed'
      },
      {
        from_user_id: 1,
        to_user_id: null,
        amount: 75.0,
        transaction_type: 'withdrawal',
        description: 'Withdrawal of 75 SMP',
        reference_id: 'withdraw_001',
        reference_type: 'withdrawal_request',
        status: 'completed'
      }
    ];
    
    for (const transactionData of testTransactions) {
      try {
        const result = await SMPTransaction.create(transactionData);
        console.log(`Created transaction: ${result.id} - ${transactionData.description}`);
      } catch (error) {
        console.error(`Failed to create transaction: ${error.message}`);
      }
    }
    
    console.log('Test SMP transactions created successfully!');
    
    // Test the getByUserId method
    console.log('\nTesting getByUserId method...');
    try {
      const transactions = await SMPTransaction.getByUserId(1, 10, 0);
      console.log(`Found ${transactions.length} transactions for user 1`);
      transactions.forEach(t => {
        console.log(`- ${t.transaction_type}: ${t.amount} SMP (${t.description})`);
      });
    } catch (error) {
      console.error('Error testing getByUserId:', error.message);
    }
    
  } catch (error) {
    console.error('Error creating test SMP transactions:', error);
  } finally {
    await pool.end();
  }
}

createTestSMPTransactions(); 