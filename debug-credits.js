// Debug script to check user credits and payments
// Run with: node debug-credits.js

const API_BASE = 'http://localhost:8080/api';

async function debugCredits() {
  console.log('🔍 Debugging User Credits...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@test.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Trying to register...');
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'demo@test.com',
          password: 'password123'
        })
      });

      if (registerResponse.ok) {
        console.log('✅ User registered successfully');
      } else {
        console.log('❌ Registration failed');
        return;
      }
    }

    // Try login again
    const loginResponse2 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@test.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse2.json();
    const token = loginData.data?.token;

    if (!token) {
      console.log('❌ No token received');
      console.log('Login response:', loginData);
      return;
    }

    console.log('✅ Login successful');

    // Step 2: Check user profile
    console.log('\n2️⃣ Checking user profile...');
    const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ User profile:');
      console.log('   Raw response:', JSON.stringify(profileData, null, 2));
      
      const user = profileData.data?.user;
      if (user) {
        console.log('   Email:', user.email);
        console.log('   Credits:', user.credits);
        console.log('   Plan:', user.plan);
        console.log('   Name:', user.name);
        console.log('   ID:', user.id);
      } else {
        console.log('❌ No user data found in response');
      }
    } else {
      console.log('❌ Failed to get profile');
      const errorData = await profileResponse.json();
      console.log('   Error:', errorData);
    }

    // Step 3: Check payment history
    console.log('\n3️⃣ Checking payment history...');
    const historyResponse = await fetch(`${API_BASE}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ Payment history:');
      console.log('   Total payments:', historyData.data?.length || 0);
      
      if (historyData.data && historyData.data.length > 0) {
        historyData.data.forEach((payment, index) => {
          console.log(`   Payment ${index + 1}:`);
          console.log(`     Plan: ${payment.planName}`);
          console.log(`     Amount: $${payment.amount}`);
          console.log(`     Credits: ${payment.credits}`);
          console.log(`     Status: ${payment.status}`);
          console.log(`     Date: ${new Date(payment.date).toLocaleString()}`);
        });
      }
    } else {
      console.log('❌ Failed to get payment history');
    }

    // Step 4: Test payment intent creation
    console.log('\n4️⃣ Testing payment intent creation...');
    const paymentIntentResponse = await fetch(`${API_BASE}/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        planId: 'pro'
      })
    });

    if (paymentIntentResponse.ok) {
      const paymentIntentData = await paymentIntentResponse.json();
      console.log('✅ Payment intent created:');
      console.log('   Plan:', paymentIntentData.plan?.name);
      console.log('   Price:', paymentIntentData.plan?.price);
      console.log('   Credits:', paymentIntentData.plan?.credits);
      console.log('   Client Secret:', paymentIntentData.clientSecret ? 'Present' : 'Missing');
    } else {
      const errorData = await paymentIntentResponse.json();
      console.log('❌ Payment intent creation failed:', errorData.message);
    }

    console.log('\n🎉 Debug completed!');
    console.log('\n💡 If credits are not updating:');
    console.log('   1. Check server logs for webhook events');
    console.log('   2. Verify Stripe webhook is configured');
    console.log('   3. Check if payment status is "succeeded"');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugCredits(); 