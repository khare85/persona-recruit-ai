// Simple test to verify company admin login
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@designfirst.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Company admin login successful!');
      console.log('User role:', result.user?.role);
      console.log('Company ID:', result.user?.companyId);
      console.log('JWT token length:', result.token?.length || 'No token');
    } else {
      const error = await response.json();
      console.log('❌ Login failed:', error.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Only run this if we're calling it directly (not importing)
if (require.main === module) {
  testLogin();
}

module.exports = { testLogin };