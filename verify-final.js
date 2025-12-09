const { createClient } = require('@supabase/supabase-js');

const URL = "https://cvxipneapzvkwjtjjskt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2eGlwbmVhcHp2a3dqdGpqc2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODk4MTcsImV4cCI6MjA4MDY2NTgxN30.OdPr9Z_QtwfCUEpDCgVuGniOFRJDJKNjwsjYZNwHERU";

async function verify() {
    console.log('Verifying connection and permissions...');
    const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

    // Try to insert a dummy project
    const { data, error } = await supabase.from('projects').insert({
        name: "Verification Project",
        total_budget: 123,
        start_date: "2024-01-01",
        deadline: "2024-12-31"
    }).select();

    if (error) {
        console.error('VERIFICATION FAILED');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
    } else {
        console.log('VERIFICATION SUCCESS');
        console.log('Project created:', data[0].id);
        // Code to delete it back? Nah, leave it as proof.
    }
}

verify();
