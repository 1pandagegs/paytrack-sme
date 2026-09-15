/* ==================================================
   PAYTRACK SME — SUPABASE CLIENT
================================================== */


const SUPABASE_URL =
  "https://sbdwjstkeeumielypvht.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_eHUjUpMt0P2KQ8tV5iBRgg_HcRgKIyy";


if (
  SUPABASE_URL ===
    "https://sbdwjstkeeumielypvht.supabase.co" ||
  SUPABASE_PUBLISHABLE_KEY ===
    "sb_publishable_eHUjUpMt0P2KQ8tV5iBRgg_HcRgKIyy"
) {

  console.warn(
    "PayTrack SME: Supabase credentials have not been configured."
  );

}


const paytrackSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


window.paytrackSupabase =
  paytrackSupabase;


console.log(
  "PayTrack SME: Supabase client initialised."
);