const axios = require('axios');

async function testApi() {
    try {
        console.log('🔵 Testing Login...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'testdoc@example.com',
            password: 'password123'
        });

        console.log('✅ Login Successful');
        const token = loginRes.data.token;
        console.log('🔑 Token:', token);

        console.log('\n🔵 Testing Profile Update...');
        const updateRes = await axios.put(
            'http://localhost:3000/api/doctors/profile',
            {
                specialization: 'Cardiology',
                experience: 10,
                consultationFee: 800
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('✅ Profile Update Successful');
        console.log('📦 Response:', updateRes.data);

    } catch (error) {
        console.error('❌ API Test Failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testApi();
