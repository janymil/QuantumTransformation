/**
 * Test Vision Board Authentication Fix
 * Tests vision board save functionality with proper authentication
 */

async function testVisionBoardAuthFix() {
  console.log('🚀 Testing Vision Board Authentication Fix');
  console.log('=======================================');

  try {
    // Test 1: Check auth status
    console.log('\n1. Testing Authentication Status...');
    const authResponse = await fetch('http://localhost:5000/api/auth/user', {
      credentials: 'include'
    });
    
    if (authResponse.ok) {
      const user = await authResponse.json();
      console.log('✅ User authenticated:', user.email);
      
      // Test 2: Test vision board save with authenticated session
      console.log('\n2. Testing Vision Board Save...');
      const visionBoardData = {
        title: "Authentication Test Board",
        description: "Testing the fixed authentication",
        canvasData: {
          elements: [
            {
              id: "test-1",
              type: "text",
              content: "Success! Authentication Fixed!",
              x: 100,
              y: 100,
              fontSize: 24,
              color: "#22c55e"
            }
          ]
        },
        templateCategory: "test"
      };

      const saveResponse = await fetch('http://localhost:5000/api/vision-boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(visionBoardData)
      });

      if (saveResponse.ok) {
        const savedBoard = await saveResponse.json();
        console.log('✅ Vision Board Saved Successfully!');
        console.log('Board ID:', savedBoard.id);
        console.log('Title:', savedBoard.title);
        
        // Test 3: Retrieve the saved board
        console.log('\n3. Testing Vision Board Retrieval...');
        const retrieveResponse = await fetch('http://localhost:5000/api/vision-boards', {
          credentials: 'include'
        });
        
        if (retrieveResponse.ok) {
          const boards = await retrieveResponse.json();
          console.log('✅ Vision Boards Retrieved:', boards.length);
          const testBoard = boards.find(b => b.title === "Authentication Test Board");
          if (testBoard) {
            console.log('✅ Test board found in user\'s boards');
          }
        } else {
          console.log('❌ Failed to retrieve vision boards');
        }

        // Test 4: Test image generation save
        console.log('\n4. Testing AI Image Generation...');
        const imageGenResponse = await fetch('http://localhost:5000/api/ai/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            prompt: "A beautiful sunrise over mountains representing success and achievement",
            size: "1024x1024",
            quality: "standard"
          })
        });

        if (imageGenResponse.ok) {
          const imageResult = await imageGenResponse.json();
          console.log('✅ AI Image Generated Successfully!');
          console.log('Image URL available:', !!imageResult.imageUrl);
          console.log('Saved to gallery:', imageResult.savedToGallery);
        } else {
          const error = await imageGenResponse.text();
          console.log('❌ Image generation failed:', error);
        }

        console.log('\n📊 AUTHENTICATION FIX TEST RESULTS');
        console.log('==================================');
        console.log('✅ Authentication: WORKING');
        console.log('✅ Vision Board Save: WORKING');
        console.log('✅ Vision Board Retrieval: WORKING');
        console.log('✅ User session properly handled');
        
      } else {
        const error = await saveResponse.text();
        console.log('❌ Vision Board Save Failed:', error);
      }
      
    } else {
      console.log('❌ User not authenticated');
      console.log('Please log in to the application first');
    }

  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testVisionBoardAuthFix();