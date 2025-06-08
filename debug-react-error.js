/**
 * Debug React Runtime Error
 * Identifies the source of the "userRef" null reference error
 */

import fs from 'fs';
import path from 'path';

async function debugReactError() {
  console.log('🔍 Debugging React Runtime Error: userRef null reference');
  
  // Search for userRef references in all possible locations
  const searchPaths = [
    'client/src',
    'node_modules/@tanstack',
    'node_modules/react',
    'node_modules/@radix-ui'
  ];
  
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      console.log(`\n📁 Searching in: ${searchPath}`);
      await searchForUserRef(searchPath);
    }
  }
  
  // Check for common React error patterns
  console.log('\n🔧 Checking common React error patterns...');
  await checkReactPatterns();
}

async function searchForUserRef(dirPath) {
  try {
    const files = getAllFiles(dirPath);
    const relevantFiles = files.filter(file => 
      file.endsWith('.js') || file.endsWith('.jsx') || 
      file.endsWith('.ts') || file.endsWith('.tsx')
    );
    
    for (const file of relevantFiles.slice(0, 20)) { // Limit search
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('userRef')) {
          console.log(`✅ Found userRef in: ${file}`);
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('userRef')) {
              console.log(`   Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
  } catch (err) {
    console.log(`❌ Error searching ${dirPath}: ${err.message}`);
  }
}

function getAllFiles(dirPath, files = []) {
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.includes('node_modules') && files.length < 100) {
          getAllFiles(fullPath, files);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      } catch (err) {
        // Skip inaccessible files/directories
      }
    }
  } catch (err) {
    // Skip inaccessible directories
  }
  return files;
}

async function checkReactPatterns() {
  // Check for common React error patterns in main components
  const mainComponents = [
    'client/src/App.tsx',
    'client/src/main.tsx',
    'client/src/components/practice-tools/vision-board.tsx',
    'client/src/components/vision-board/enhanced-vision-board.tsx'
  ];
  
  for (const component of mainComponents) {
    if (fs.existsSync(component)) {
      console.log(`\n📄 Checking: ${component}`);
      const content = fs.readFileSync(component, 'utf8');
      
      // Check for useRef without proper initialization
      const useRefMatches = content.match(/useRef\([^)]*\)/g);
      if (useRefMatches) {
        console.log(`   useRef calls: ${useRefMatches.length}`);
        useRefMatches.forEach((match, index) => {
          console.log(`     ${index + 1}: ${match}`);
        });
      }
      
      // Check for potential null reference patterns
      const nullRefPatterns = [
        /\.current\?/g,
        /\.current\!/g,
        /\.current &&/g,
        /if.*\.current/g
      ];
      
      nullRefPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`   Null-safe pattern ${index + 1}: ${matches.length} matches`);
        }
      });
    }
  }
}

debugReactError().catch(console.error);