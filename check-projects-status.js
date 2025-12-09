const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
    console.log("Checking all projects...");
    const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, created_at');

    if (error) {
        console.error("Error fetching projects:", error);
        return;
    }

    console.log(`Found ${data.length} projects:`);
    console.table(data);
}

checkProjects();
