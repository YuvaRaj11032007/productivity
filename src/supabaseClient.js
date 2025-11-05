import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aojvwqwucdrzpwvuobcu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvanZ3cXd1Y2RyenB3dnVvYmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTA5OTUsImV4cCI6MjA3NzkyNjk5NX0.z3gobrtj9EAUEMIyeYbXkSzGr0dg0-i5b9J1TwCcg2E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);