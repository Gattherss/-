const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function test() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Testing Insert with ANON key...');
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const { data, error } = await supabase.from('projects').insert({
        name: "Test Insert",
        total_budget: 100,
        start_date: "2024-01-01",
        deadline: "2024-12-31"
    });

    if (error) {
        console.log('Insert Failed with Code:', error.code);
        console.log('Message:', error.message);
        // 42501 = permission denied (RLS)
        // PGRST205 = schema cache missing
        // FetchError = network
    } else {
        console.log('Insert SUCCESS!');
    }
}

test();
