const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const newLines = lines.filter(line => !line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY'));

    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('Removed stale SUPABASE_SERVICE_ROLE_KEY');
} else {
    console.log('.env.local not found');
}
