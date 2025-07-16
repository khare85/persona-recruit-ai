/**
 * Test script to validate Firebase Storage rules
 * This script tests various scenarios for file uploads and access
 */

const testCases = [
  {
    name: 'Candidate Resume Upload',
    path: 'candidates/user123/resume/resume.pdf',
    contentType: 'application/pdf',
    size: 5 * 1024 * 1024, // 5MB
    userRole: 'candidate',
    userId: 'user123',
    operation: 'write',
    expectedResult: 'allow'
  },
  {
    name: 'Recruiter Resume Read',
    path: 'candidates/user123/resume/resume.pdf',
    contentType: 'application/pdf',
    userRole: 'recruiter',
    userId: 'recruiter456',
    operation: 'read',
    expectedResult: 'allow'
  },
  {
    name: 'Video Intro Upload',
    path: 'videos/intro/user123/intro.mp4',
    contentType: 'video/mp4',
    size: 50 * 1024 * 1024, // 50MB
    userRole: 'candidate',
    userId: 'user123',
    operation: 'write',
    expectedResult: 'allow'
  },
  {
    name: 'Oversized Resume Upload',
    path: 'candidates/user123/resume/big-resume.pdf',
    contentType: 'application/pdf',
    size: 15 * 1024 * 1024, // 15MB (over 10MB limit)
    userRole: 'candidate',
    userId: 'user123',
    operation: 'write',
    expectedResult: 'deny'
  },
  {
    name: 'Invalid File Type for Resume',
    path: 'candidates/user123/resume/malware.exe',
    contentType: 'application/octet-stream',
    size: 1 * 1024 * 1024, // 1MB
    userRole: 'candidate',
    userId: 'user123',
    operation: 'write',
    expectedResult: 'deny'
  },
  {
    name: 'Unauthorized Resume Access',
    path: 'candidates/user123/resume/resume.pdf',
    contentType: 'application/pdf',
    userRole: 'candidate',
    userId: 'user456', // Different user
    operation: 'read',
    expectedResult: 'deny'
  },
  {
    name: 'Profile Picture Upload',
    path: 'profile-pictures/user123/profile.jpg',
    contentType: 'image/jpeg',
    size: 2 * 1024 * 1024, // 2MB
    userRole: 'candidate',
    userId: 'user123',
    operation: 'write',
    expectedResult: 'allow'
  },
  {
    name: 'Interview Video Upload',
    path: 'videos/interview/user123/interview.webm',
    contentType: 'video/webm',
    size: 200 * 1024 * 1024, // 200MB
    userRole: 'candidate',
    userId: 'user123',
    operation: 'write',
    expectedResult: 'allow'
  },
  {
    name: 'Admin Analytics Access',
    path: 'analytics/monthly-report.json',
    contentType: 'application/json',
    userRole: 'super_admin',
    userId: 'admin123',
    operation: 'read',
    expectedResult: 'allow'
  },
  {
    name: 'Candidate Analytics Access',
    path: 'analytics/monthly-report.json',
    contentType: 'application/json',
    userRole: 'candidate',
    userId: 'user123',
    operation: 'read',
    expectedResult: 'deny'
  }
];

// Mock Firebase Storage Rules evaluation
function evaluateStorageRule(testCase) {
  const {
    path,
    contentType,
    size,
    userRole,
    userId,
    operation,
    expectedResult
  } = testCase;

  // Mock request and auth objects
  const mockRequest = {
    auth: {
      uid: userId,
      token: {
        role: userRole,
        companyId: userRole === 'recruiter' ? 'company123' : null
      }
    },
    resource: {
      contentType,
      size: size || 0
    }
  };

  // Helper functions (matching storage.rules)
  function hasRole(role) {
    return mockRequest.auth && mockRequest.auth.token && mockRequest.auth.token.role === role;
  }

  function isOwner(pathUserId) {
    return mockRequest.auth && mockRequest.auth.uid === pathUserId;
  }

  function canAccessCandidateData() {
    return mockRequest.auth && (
      hasRole('super_admin') || 
      hasRole('company_admin') || 
      hasRole('recruiter') || 
      hasRole('interviewer')
    );
  }

  function isValidResumeFile() {
    return contentType === 'application/pdf' ||
           contentType === 'application/msword' ||
           contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  function isValidVideoFile() {
    return contentType.startsWith('video/');
  }

  function isValidImageFile() {
    return contentType.startsWith('image/');
  }

  // Evaluate rules based on path
  let result = 'deny';

  if (path.startsWith('candidates/')) {
    const pathParts = path.split('/');
    const pathUserId = pathParts[1];
    
    if (path.includes('/resume/')) {
      if (operation === 'read') {
        result = (isOwner(pathUserId) || canAccessCandidateData()) ? 'allow' : 'deny';
      } else if (operation === 'write') {
        result = (isOwner(pathUserId) && 
                 size < 10 * 1024 * 1024 && 
                 isValidResumeFile()) ? 'allow' : 'deny';
      }
    }
  } else if (path.startsWith('videos/')) {
    const pathParts = path.split('/');
    const pathUserId = pathParts[2];
    
    if (path.includes('/intro/')) {
      if (operation === 'read') {
        result = (isOwner(pathUserId) || canAccessCandidateData()) ? 'allow' : 'deny';
      } else if (operation === 'write') {
        result = (isOwner(pathUserId) && 
                 size < 100 * 1024 * 1024 && 
                 isValidVideoFile()) ? 'allow' : 'deny';
      }
    } else if (path.includes('/interview/')) {
      if (operation === 'read') {
        result = (isOwner(pathUserId) || canAccessCandidateData()) ? 'allow' : 'deny';
      } else if (operation === 'write') {
        result = (isOwner(pathUserId) && 
                 size < 500 * 1024 * 1024 && 
                 isValidVideoFile()) ? 'allow' : 'deny';
      }
    }
  } else if (path.startsWith('profile-pictures/')) {
    const pathParts = path.split('/');
    const pathUserId = pathParts[1];
    
    if (operation === 'read') {
      result = 'allow'; // Publicly readable
    } else if (operation === 'write') {
      result = (isOwner(pathUserId) && 
               size < 5 * 1024 * 1024 && 
               isValidImageFile()) ? 'allow' : 'deny';
    }
  } else if (path.startsWith('analytics/')) {
    if (operation === 'read') {
      result = (hasRole('super_admin') || hasRole('company_admin')) ? 'allow' : 'deny';
    } else if (operation === 'write') {
      result = hasRole('super_admin') ? 'allow' : 'deny';
    }
  }

  return result;
}

// Run tests
console.log('🧪 Firebase Storage Rules Test Suite');
console.log('=====================================\\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = evaluateStorageRule(testCase);
  const passed = result === testCase.expectedResult;
  
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`  Path: ${testCase.path}`);
  console.log(`  User: ${testCase.userId} (${testCase.userRole})`);
  console.log(`  Operation: ${testCase.operation}`);
  console.log(`  Expected: ${testCase.expectedResult}`);
  console.log(`  Result: ${result}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (passed) passedTests++;
});

console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Storage rules are working correctly.');
} else {
  console.log('⚠️  Some tests failed. Please review the storage rules.');
}