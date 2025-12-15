const axios = require('axios');

async function testUserProfileUpdate() {
    try {
        // Register a new regular user
        console.log('🔵 Registering test user...');
        const registerRes = await axios.post('http://localhost:3000/api/auth/register', {
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
            role: 'user'
        });

        console.log('✅ User Registered');
        const token = registerRes.data.token;
        console.log('🔑 Token:', token);

        console.log('\n🔵 Testing User Profile Update...');
        const updateRes = await axios.put(
            'http://localhost:3000/api/users/profile',
            {
                name: 'Updated Test User',
                phone: '1234567890'
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('✅ Profile Update Successful');
        console.log('📦 Response:', updateRes.data);

    } catch (error) {
        console.error('❌ Test Failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testUserProfileUpdate();
