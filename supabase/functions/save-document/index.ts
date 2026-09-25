import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      fileBase64,
      fileName,
      buildingId,
      category,
      subcategory,
      issuedAt,
      expiresAt,
      responsibleCompany,
      status,
    } = await req.json();

    if (!fileBase64 || !fileName || !buildingId || !category) {
      return new Response(
        JSON.stringify({ error: "fileBase64, fileName, buildingId e category são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Decode base64 to Uint8Array
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Build storage path
    // Storage keys must be ASCII-safe: strip accents, spaces and special chars
    const sanitize = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "arquivo";
    const storagePath = `${sanitize(buildingId)}/${sanitize(category)}/${Date.now()}_${sanitize(fileName)}`;

    // Determine content type
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      csv: "text/csv",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("building-documents")
      .upload(storagePath, bytes, { contentType, upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Erro ao fazer upload do arquivo", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("building-documents")
      .getPublicUrl(storagePath);

    // Insert metadata
    const { data: doc, error: insertError } = await supabase
      .from("building_documents")
      .insert({
        building_id: buildingId,
        category,
        subcategory: subcategory || null,
        file_name: fileName,
        file_path: storagePath,
        file_type: ext,
        file_size: `${(bytes.length / 1024).toFixed(0)} KB`,
        issued_at: issuedAt || null,
        expires_at: expiresAt || null,
        status: status || "Atualizado",
        responsible_company: responsibleCompany || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar metadados", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        document: doc,
        publicUrl: urlData.publicUrl,
        message: `Documento "${fileName}" salvo em ${buildingId} > ${category}${subcategory ? ` > ${subcategory}` : ""}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("save-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
