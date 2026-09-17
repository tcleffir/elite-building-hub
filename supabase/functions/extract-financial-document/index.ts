import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileBase64, fileName, promptType } = await req.json()
    if (!fileBase64 || !fileName) {
      return new Response(JSON.stringify({ success: false, error: 'fileBase64 and fileName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('LOVABLE_API_KEY não configurada')

    const financialPrompt = `Você é um assistente especializado em extração de dados de documentos financeiros brasileiros.
    
Analise este documento (nota fiscal, boleto, recibo, comprovante de pagamento ou extrato) e extraia as seguintes informações em formato JSON:

{
  "data": "YYYY-MM-DD (data do documento/vencimento/pagamento)",
  "valor": 0.00,
  "tipo": "receita" ou "despesa",
  "categoria": uma das opções: "Aluguel", "IPTU", "Condomínio", "Manutenção", "Seguro", "Honorários de Gestão", "Outras Receitas", "Outras Despesas",
  "subcategoria": "texto livre",
  "descricao": "descrição curta do lançamento (máx 60 caracteres)",
  "fornecedor": "nome da empresa/pessoa (emissor ou beneficiário)",
  "cnpj": "XX.XXX.XXX/XXXX-XX ou null",
  "edificio": "nome do edifício se mencionado, ou null",
  "observacoes": "qualquer informação relevante adicional",
  "confianca": "alta", "media" ou "baixa"
}

Se não conseguir extrair algum campo com segurança, use null.
Responda APENAS com o JSON, sem texto adicional.`

    const documentPrompt = `Analise este documento predial/imobiliário e retorne JSON:
{
  "nome": "nome descritivo do documento",
  "tipo": uma das opções: "Segurança e Compliance", "Técnico / Engenharia", "Gestão Predial", "ESG & Sustentabilidade", "Financeiro", "Fornecedores",
  "subpasta": "nome da subpasta mais adequada dentro do tipo",
  "dataEmissao": "YYYY-MM-DD ou null",
  "dataValidade": "YYYY-MM-DD ou null",
  "empresa": "nome da empresa/órgão emissor",
  "descricao": "resumo em 1 linha do que é o documento",
  "confianca": número de 0 a 100
}

Se não conseguir extrair algum campo com segurança, use null.
Responda APENAS com o JSON, sem texto adicional.`

    const prompt = promptType === 'document' ? documentPrompt : financialPrompt

    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName)
    const mediaType = isImage
      ? (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')
      : 'application/pdf'

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mediaType};base64,${fileBase64}` },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI Gateway error:', response.status, errText)

      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const aiData = await response.json()
    const content = aiData.choices?.[0]?.message?.content || ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in AI response')

    const extracted = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('extract-financial-document error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
