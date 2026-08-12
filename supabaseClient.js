import { createClient } from "@supabase/supabase-js";

// Der "publishable" Key ist zum öffentlichen Einbetten im Frontend gedacht,
// die eigentliche Sicherheit übernehmen die Row-Level-Security-Regeln in
// der Datenbank (siehe mantycat_schema.sql). Trotzdem: niemals den
// "service_role"/geheimen Key hier eintragen, nur diesen "publishable" Key.
const supabaseUrl = "https://wfvdsiermqgsyhuygqtw.supabase.co";
const supabaseAnonKey = "sb_publishable_YuMokdusyUdDd_CYLSguQw_1Xsws9do";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
