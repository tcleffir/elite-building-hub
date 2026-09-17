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
    const { fileBase64, fileName } = await req.json()
    if (!fileBase64 || !fileName) {
      return new Response(JSON.stringify({ success: false, error: 'fileBase64 and fileName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('LOVABLE_API_KEY não configurada')

    const prompt = `Você é um assistente especializado em extrair informações de equipamentos prediais a partir de documentos como notas fiscais (NF), termos de garantia, manuais e fotos de plaquetas de identificação.

Analise o documento ou foto enviada e devolva JSON com as seguintes informações sobre o ATIVO/EQUIPAMENTO:

{
  "name": "nome descritivo do equipamento (ex: 'Ar-Condicionado VRF Daikin')",
  "brand": "marca/fabricante",
  "model": "modelo do equipamento",
  "serialNumber": "número de série, se visível",
  "description": "descrição curta (até 120 caracteres)",
  "category": uma das opções: "climatizacao", "eletrica", "hidraulica", "seguranca", "transporte_vertical", "outros",
  "purchaseDate": "YYYY-MM-DD (data da compra ou emissão da NF)",
  "purchasePrice": número (valor pago em reais, sem símbolo, ex: 45000),
  "supplier": "nome do fornecedor/empresa que vendeu",
  "invoiceNumber": "número da NF",
  "invoiceDate": "YYYY-MM-DD",
  "installer": "empresa que instalou, se mencionada",
  "installationDate": "YYYY-MM-DD ou null",
  "warrantyType": "manufacturer" ou "extended",
  "warrantyStartDate": "YYYY-MM-DD ou null",
  "warrantyEndDate": "YYYY-MM-DD ou null",
  "warrantyTerms": "resumo dos termos de garantia",
  "supplierContactName": "nome do contato/SAC",
  "supplierContactPhone": "telefone formatado",
  "supplierContactEmail": "e-mail",
  "periodicity": "monthly", "quarterly", "biannual" ou "annual" (sugestão baseada no tipo de equipamento),
  "confianca": "alta", "media" ou "baixa"
}

Se não conseguir extrair algum campo com segurança, use null.
Responda APENAS com o JSON, sem texto adicional.`

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
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${fileBase64}` } },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI Gateway error:', response.status, errText)
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit excedido. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Créditos insuficientes na sua conta Lovable AI.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const aiData = await response.json()
    const content = aiData.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Nenhum JSON encontrado na resposta da IA')
    const extracted = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('extract-asset-document error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})