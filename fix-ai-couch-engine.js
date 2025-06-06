const fs = require('fs');

// Read the file
let content = fs.readFileSync('server/ai-couch-engine.ts', 'utf8');

// Replace all remaining Anthropic patterns with OpenAI equivalents
content = content.replace(/anthropic\.messages\.create/g, 'openai.chat.completions.create');
content = content.replace(/model: 'claude-sonnet-4-20250514'/g, "model: 'gpt-4o'");
content = content.replace(/const content = response\.content\[0\];/g, 'const content = response.choices[0].message.content;');
content = content.replace(/if \(content\.type === 'text'\) \{/g, 'if (content) {');
content = content.replace(/JSON\.parse\(content\.text\)/g, 'JSON.parse(content || "{}")');
content = content.replace(/return content\.text/g, 'return content');
content = content.replace(/content\.text/g, 'content || ""');
content = content.replace(/} catch \{[\s\S]*?\}\s*}/g, '} catch {\n        return {};\n      }\n    }');

// Add response_format to all OpenAI calls that don't have it
content = content.replace(/messages: \[{ role: 'user', content: prompt }\]\s*\}\);/g, 
  "messages: [{ role: 'user', content: prompt }],\n      response_format: { type: \"json_object\" }\n    });");

// Write the file back
fs.writeFileSync('server/ai-couch-engine.ts', content);

console.log('Fixed AI Couch Engine API calls');