
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  cabinId: string;
  professionalId: string;
  date: string;
  shift: string;
  price: number;
  status?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { cabinId, professionalId, date, shift, price, status = "confirmed" }: BookingRequest = await req.json();

    // Validate required fields
    if (!cabinId || !professionalId || !date || !shift || price === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields. Please provide cabinId, professionalId, date, shift, and price.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert booking directly into bookings table
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        cabin_id: cabinId,
        professional_id: professionalId,
        date,
        shift,
        price,
        status,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
