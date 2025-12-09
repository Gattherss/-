const { createClient } = require('@supabase/supabase-js');
const URL = "https://cvxipneapzvkwjtjjskt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2eGlwbmVhcHp2a3dqdGpqc2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODk4MTcsImV4cCI6MjA4MDY2NTgxN30.OdPr9Z_QtwfCUEpDCgVuGniOFRJDJKNjwsjYZNwHERU";

async function checkSchema() {
    const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

    // Try to select 'status' from projects
    const { data, error } = await supabase
        .from('projects')
        .select('status')
        .limit(1);

    if (error) {
        console.log("Error selecting status:", error.message);
        if (error.message.includes("does not exist")) {
            console.log("DIAGNOSIS: The 'status' column is MISSING.");
        }
    } else {
        console.log("Success: 'status' column exists.");
    }
}

checkSchema();
