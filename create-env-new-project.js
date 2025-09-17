// Script to create .env file for your NEW Supabase project
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setting up environment variables for your NEW Supabase project...\n');

// Function to ask for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createEnvFile() {
  try {
    console.log('📋 Please provide your NEW Supabase project details:\n');
    
    const projectUrl = await askQuestion('🔗 Project URL (e.g., https://your-project-id.supabase.co): ');
    const anonKey = await askQuestion('🔑 Anon Key: ');
    const serviceRoleKey = await askQuestion('🔐 Service Role Key: ');
    const databaseUrl = await askQuestion('🗄️ Database URL (optional, press Enter to skip): ');
    
    // Generate environment content
    const envContent = `# Supabase Configuration - NEW PROJECT
VITE_SUPABASE_URL=${projectUrl}
VITE_SUPABASE_ANON_KEY=${anonKey}
VITE_SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Database Configuration
${databaseUrl ? `DATABASE_URL=${databaseUrl}` : '# DATABASE_URL=your-database-url-here'}

# Application Configuration
NODE_ENV=development
VITE_APP_ENV=development
`;

    // Write to .env file
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ .env file created successfully for your NEW project!');
    console.log('📝 Your new Supabase configuration has been added to the .env file.');
    console.log('🔒 The .env file is automatically ignored by git for security.');
    
    console.log('\n📋 Next steps:');
    console.log('1. Import your database data to the new project');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    console.log('4. Test your application with the new database');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  } finally {
    rl.close();
  }
}

createEnvFile();
