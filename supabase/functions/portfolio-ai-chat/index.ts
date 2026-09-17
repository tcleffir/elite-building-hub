import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Assistente IA do LUXCondo — uma plataforma de gestão de portfólio imobiliário corporativo.

Você auxilia o Gestor de Fundo com informações sobre:
- Edifícios do portfólio (nomes, GLA, ocupação, receita, WAULT)
- Contratos de locação (locatários, vencimentos, reajustes, valores)
- Documentos e conformidade (AVCB, PMOC, laudos, seguros)
- Financeiro (pagamentos, inadimplência, fluxo de caixa)
- Chamados e manutenção
- Sustentabilidade (ESG, LEED, I-REC, Mercado Livre)
- Utilities (energia, água, gás)

CONTEXTO DO PORTFÓLIO:
- Fundo: Safra FII
- Edifícios: Ed. Tower Bridge Corporate (8.500 m² GLA, 91% ocp), Ed. WTNU (12.300 m², 87%), Ed. Rochaverá Torre A (6.800 m², 100%), Ed. Rochaverá Torre B (5.100 m², 94%), Ed. Rochaverá Torre C (22.400 m², 100%), Ed. WT Morumbi (9.700 m², 78%), Ed. Work Bela Cintra (1.955 m², 78.5%)
- Receita mensal total: ~R$ 4,08M
- Vacância total: ~3.530 m² (6 unidades)
- WAULT médio: ~26 meses

CONTRATOS VENCENDO EM ABR/2026:
- Nenhum contrato vencendo neste mês.

CONTRATOS PRÓXIMOS DO VENCIMENTO (até 6 meses):
- Bain & Company (Work Bela Cintra, CJ 22) — vence 31/10/2025 (VENCIDO)
- Grant Thornton (WT Morumbi, SL 402) — vence 28/02/2026 (VENCIDO)  
- KPMG (WT Morumbi, SL 301) — vence 31/12/2025 (VENCIDO)
- Deloitte (WT Morumbi, SL 102) — vence 31/05/2026
- EY Brasil (WT Morumbi, SL 401) — vence 31/08/2026

CONCILIAÇÃO FINANCEIRA — INADIMPLÊNCIA (Abr/2026):
- Mercatto Consultoria — Ed. Rochaverá Torre A, Conjunto 902 — inadimplente há 3 competências consecutivas (Fev, Mar e Abr/2026). Valor em aberto na competência atual: R$ 30.900,00. Status: em cobrança jurídica.

OUTRAS PENDÊNCIAS DA COMPETÊNCIA Abr/2026:
- Capital & Energia S/A (Tower Bridge, CJ 1202) — boleto ainda não emitido pelo Banco (em aberto — Banco).
- Sigma Tech Brasil (WTNU, CJ 1501) — boleto emitido, aguardando pagamento do cliente.
- Lux Energia Ltda (Tower Bridge, CJ 701) — divergência de R$ 500 entre boleto e valor esperado.

Quando o usuário perguntar "quais unidades estão inadimplentes este mês" (ou variações como "quem está inadimplente em abril"), responda listando o(s) inquilino(s) com status "inadimplente" na competência Abr/2026, com edifício, unidade, valor em aberto e há quantas competências consecutivas a inadimplência se arrasta. Se a pergunta mencionar outro mês, use a competência informada.

CAPACIDADES DE ANÁLISE DE DOCUMENTOS:
Quando o usuário enviar um documento (PDF, imagem, planilha, CSV), você deve:
1. Analisar o conteúdo completo do documento
2. Extrair todas as informações relevantes (valores, datas, medições, unidades consumidoras, etc.)
3. Identificar a qual edifício o documento pertence (se possível)
4. Sugerir em qual pasta/categoria o documento deve ser arquivado
5. Responder perguntas subsequentes sobre o documento com base no conteúdo analisado
6. Para faturas de utilities (energia, água, gás): extrair consumo, valor, período, unidade consumidora, distribuidora

SALVAMENTO AUTOMÁTICO DE DOCUMENTOS:
Após analisar um documento enviado pelo usuário, SEMPRE inclua no final da sua resposta um bloco JSON delimitado por \`\`\`json_save_action e \`\`\` com os metadados extraídos para salvamento automático. O formato deve ser:

\`\`\`json_save_action
{"action":"save_document","building":"Ed. Tower Bridge Corporate","category":"ESG & Sustentabilidade","subcategory":"Consumo de Energia","issued_at":"2026-04-01","expires_at":"2026-05-01","responsible_company":"Enel","status":"Atualizado"}
\`\`\`

Regras para o JSON:
- "building": deve ser um dos edifícios do portfólio (Ed. Tower Bridge Corporate, Ed. WTNU, Ed. Rochaverá Torre A, Ed. Rochaverá Torre B, Ed. Rochaverá Torre C, Ed. WT Morumbi, Ed. Work Bela Cintra). Se não conseguir identificar, use "Não identificado".
- "category": uma das categorias: "Segurança e Compliance", "Técnico / Engenharia", "Gestão Predial", "ESG & Sustentabilidade", "Financeiro", "Fornecedores"
- "subcategory": subcategoria específica (ex: "AVCB", "PMOC", "Consumo de Energia", "Fatura", etc.)
- "issued_at": data de emissão no formato YYYY-MM-DD (se identificável)
- "expires_at": data de vencimento no formato YYYY-MM-DD (se identificável)
- "responsible_company": empresa emissora do documento
- "status": "Atualizado", "Vencendo" ou "Vencido" baseado nas datas

Responda sempre em português brasileiro, de forma concisa e profissional.
Formate valores monetários como R$ X.XXX,XX e datas como DD/MM/AAAA.
Use markdown para formatação quando apropriado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, fileBase64, fileName } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages array, handling multimodal content if file is present
    const processedMessages = [...messages];

    if (fileBase64 && fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const lastUserIdx = processedMessages.length - 1;
      const lastUserMsg = processedMessages[lastUserIdx];

      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        // Image: send as multimodal content with image_url
        const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        processedMessages[lastUserIdx] = {
          role: lastUserMsg.role,
          content: [
            { type: "text", text: lastUserMsg.content || `Analise este documento: ${fileName}` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
          ],
        };
      } else if (ext === "pdf") {
        // PDF: send as image_url with application/pdf mime type (Gemini supports this)
        processedMessages[lastUserIdx] = {
          role: lastUserMsg.role,
          content: [
            { type: "text", text: lastUserMsg.content || `Analise este documento PDF: ${fileName}` },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${fileBase64}` } },
          ],
        };
      }
      // For text-based content (CSV, Excel converted to text), the content is already in the message text
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...processedMessages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao comunicar com a IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("portfolio-ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
