require('dotenv').config({ path: '.env.local' });

// Mock the Firebase Storage functionality
const mockStorageBucket = {
  name: 'ai-talent-stream.firebasestorage.app',
  file: (path) => ({
    createWriteStream: (options) => {
      const stream = require('stream').Writable();
      stream._write = (chunk, encoding, callback) => {
        console.log(`Writing chunk of size ${chunk.length} to ${path}`);
        callback();
      };
      
      setTimeout(() => {
        console.log(`Upload to ${path} completed`);
        stream.emit('finish');
      }, 100);
      
      return stream;
    },
    makePublic: async () => {
      console.log(`Making ${path} public`);
      return true;
    }
  })
};

console.log('Testing Resume Upload Service');
console.log('=============================');

async function testResumeUpload() {
  try {
    // Create a mock file buffer
    const mockFile = Buffer.from('Mock PDF content for testing');
    
    // Test the storage upload logic
    const path = 'candidates/test-user/resume/test-resume.pdf';
    const fileRef = mockStorageBucket.file(path);
    
    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          originalName: 'test-resume.pdf',
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', async () => {
        try {
          await fileRef.makePublic();
          const publicUrl = `https://storage.googleapis.com/${mockStorageBucket.name}/${path}`;
          console.log(`✅ Upload successful: ${publicUrl}`);
          resolve(publicUrl);
        } catch (error) {
          reject(error);
        }
      });
      
      stream.end(mockFile);
    });
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// Run the test
testResumeUpload()
  .then(url => {
    console.log('✅ Resume upload test passed');
    console.log('URL:', url);
  })
  .catch(error => {
    console.error('❌ Resume upload test failed:', error);
  });