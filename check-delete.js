const { createClient } = require('@supabase/supabase-js');
const URL = "https://cvxipneapzvkwjtjjskt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2eGlwbmVhcHp2a3dqdGpqc2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODk4MTcsImV4cCI6MjA4MDY2NTgxN30.OdPr9Z_QtwfCUEpDCgVuGniOFRJDJKNjwsjYZNwHERU";

async function checkTransaction() {
    const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

    // Look for any transaction with vendor 'Test Bot'
    const { data: txs, error } = await supabase.from('transactions')
        .select('*')
        .eq('vendor', 'Test Bot');

    if (error) {
        console.error("Error checking:", error);
        return;
    }

    if (txs.length === 0) {
        console.log("Transaction NOT FOUND (Delete successful)");
    } else {
        console.log("Transaction FOUND (Delete failed or not clicked)");
        console.log("IDs:", txs.map(t => t.id));
    }
}

checkTransaction();
