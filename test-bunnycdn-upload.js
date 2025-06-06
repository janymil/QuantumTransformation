/**
 * Test BunnyCDN Upload Functionality
 */

async function testBunnyCDNUpload() {
  console.log('Testing BunnyCDN upload functionality...');
  
  // Test environment variables
  const storageZone = process.env.VITE_BUNNYCDN_STORAGE_ZONE;
  const accessKey = process.env.VITE_BUNNYCDN_ACCESS_KEY;
  
  console.log('Storage Zone:', storageZone);
  console.log('Access Key:', accessKey ? `${accessKey.substring(0, 8)}...` : 'Not found');
  
  if (!storageZone || !accessKey) {
    console.error('BunnyCDN credentials not found in environment');
    return;
  }
  
  // Create a test image (1x1 red pixel)
  const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  
  try {
    // Test upload
    const filename = `test_${Date.now()}.jpg`;
    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${filename}`;
    
    // Convert base64 to blob
    const response = await fetch(testImageBase64);
    const blob = await response.blob();
    
    // Upload to BunnyCDN
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': accessKey,
        'Content-Type': 'image/jpeg'
      },
      body: blob
    });
    
    if (uploadResponse.ok) {
      const cdnUrl = `https://${storageZone}.b-cdn.net/${filename}`;
      console.log('✅ Upload successful!');
      console.log('CDN URL:', cdnUrl);
      
      // Test if file is accessible
      const testAccess = await fetch(cdnUrl);
      if (testAccess.ok) {
        console.log('✅ File accessible via CDN');
      } else {
        console.log('⚠️ File uploaded but not yet accessible via CDN (may take a few minutes)');
      }
    } else {
      console.error('❌ Upload failed:', uploadResponse.status, uploadResponse.statusText);
      const errorText = await uploadResponse.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBunnyCDNUpload();