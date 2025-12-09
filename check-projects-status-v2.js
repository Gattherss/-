// Minimal script to check Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read env file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log("Connecting to:", url);

const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.from('projects').select('id, name, status');
    if (error) {
        console.error(error);
    } else {
        console.table(data);
    }
}
run();
