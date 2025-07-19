// Simple test to check if payment confirmation works
// This will help us debug the credit update issue

const API_BASE = 'http://localhost:8080/api';

async function simpleTest() {
  console.log('🧪 Simple Payment System Test...\n');

  try {
    // Step 1: Test API health
    console.log('1️⃣ Testing API health...');
    const healthResponse = await fetch(`${API_BASE}/ping`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData.message);
    console.log('   Database:', healthData.database.status);

    // Step 2: Test payment API
    console.log('\n2️⃣ Testing payment API...');
    const paymentTestResponse = await fetch(`${API_BASE}/payments/test`);
    const paymentTestData = await paymentTestResponse.json();
    console.log('✅ Payment API:', paymentTestData.message);
    console.log('   Available plans:', paymentTestData.plans);
    console.log('   Stripe configured:', paymentTestData.stripe);

    // Step 3: Test with a different user (to avoid rate limiting)
    console.log('\n3️⃣ Testing with different user...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123'
      })
    });

    if (registerResponse.ok) {
      console.log('✅ New user registered');
      
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test2@example.com',
          password: 'password123'
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const token = loginData.data?.token;
        
        if (token) {
          console.log('✅ Login successful with new user');
          
          // Step 4: Check initial credits
          console.log('\n4️⃣ Checking initial credits...');
          const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const user = profileData.data?.user;
            console.log('✅ Initial user data:');
            console.log('   Email:', user?.email);
            console.log('   Credits:', user?.credits);
            console.log('   Plan:', user?.plan);
            
            // Step 5: Create a payment intent
            console.log('\n5️⃣ Creating payment intent...');
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
              
              // Step 6: Simulate payment confirmation (this is what the frontend does)
              console.log('\n6️⃣ Testing payment confirmation...');
              const confirmResponse = await fetch(`${API_BASE}/payments/confirm`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  paymentIntentId: paymentIntentData.paymentIntentId
                })
              });

              if (confirmResponse.ok) {
                const confirmData = await confirmResponse.json();
                console.log('✅ Payment confirmation response:');
                console.log('   Success:', confirmData.success);
                console.log('   Message:', confirmData.message);
                console.log('   Credits Added:', confirmData.creditsAdded);
                console.log('   New Balance:', confirmData.newBalance);
              } else {
                const errorData = await confirmResponse.json();
                console.log('❌ Payment confirmation failed:', errorData.message);
              }
            } else {
              const errorData = await paymentIntentResponse.json();
              console.log('❌ Payment intent creation failed:', errorData.message);
            }
          } else {
            console.log('❌ Failed to get profile');
          }
        } else {
          console.log('❌ No token received');
        }
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Registration failed');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
simpleTest(); 