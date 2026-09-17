import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const buildPrompt = (taxonomy: string, assets: string) => `Você é o analista documental de um gestor de portfólio de fundos imobiliários (Vinci Compass, fundo logístico VILG11).

Sua tarefa: ler o documento enviado (contrato de locação, aditivo, apólice de seguro, laudo técnico, AVCB, PMOC, IPTU, nota fiscal, boleto, fatura de utilities, ART, alvará, planilha, foto de placa/equipamento, etc.) e devolver uma ficha COMPLETA e DETALHADA do que se trata, com TODOS os dados relevantes que existirem no documento.

TAXONOMIA DE PASTAS DISPONÍVEL (categoria > subpasta):
${taxonomy}

ATIVOS DO PORTFÓLIO:
${assets}

Regras de extração por tipo:
- Contrato de locação / aditivo: locatário, locador, ativo, unidade/módulo, área locada (m²), valor de aluguel mensal, valor por m², índice de reajuste (IGP-M, IPCA, INPC), mês/data do próximo reajuste, periodicidade do reajuste, data de início, data de término, prazo (meses), carência, desconto/step rent, multa por rescisão, garantia (fiança bancária, caução, seguro-fiança) e sua validade, tipo de contrato (típico/atípico), revisional (36 meses), cláusulas relevantes.
- Apólice de seguro: seguradora, nº apólice, coberturas, importância segurada, prêmio, vigência.
- Laudo/AVCB/PMOC/ART/alvará: órgão/empresa emissora, nº do documento, escopo, data de emissão, validade, responsável técnico, apontamentos/não conformidades.
- Fatura/utilities: distribuidora, unidade consumidora, período de consumo, consumo medido, valor, vencimento, bandeira/tarifa.
- Nota fiscal/boleto/IPTU: emissor, CNPJ, nº do documento, valor, vencimento, parcelas, competência.

Responda APENAS com JSON válido nesta estrutura:
{
  "docType": "rótulo curto do tipo de documento (ex: 'Contrato de Locação Atípico')",
  "docTypeKey": "contrato_locacao | aditivo | seguro | laudo_tecnico | avcb | pmoc | art | alvara | iptu | nota_fiscal | boleto | fatura_utilities | relatorio | planilha | foto_ativo | outro",
  "nome": "nome sugerido do arquivo (descritivo e padronizado)",
  "resumo": "resumo executivo do documento em 2 a 4 frases, dizendo exatamente do que se trata",
  "destino": { "categoria": "categoria exata da taxonomia", "subpasta": "subpasta exata da taxonomia" },
  "ativo": "nome do ativo do portfólio ou 'Não identificado'",
  "empresa": "empresa/órgão emissor ou contraparte",
  "contraparte": "locatário/fornecedor/segurado, se aplicável",
  "documentoNumero": "número do documento/contrato/apólice ou null",
  "dataEmissao": "YYYY-MM-DD ou null",
  "dataValidade": "YYYY-MM-DD ou null (validade/vencimento/término)",
  "financeiro": {
    "valorAluguel": número ou null,
    "valorPorM2": número ou null,
    "areaM2": número ou null,
    "valorTotal": número ou null,
    "moeda": "BRL"
  },
  "reajuste": {
    "indice": "IGP-M | IPCA | INPC | outro | null",
    "periodicidade": "anual | bienal | outro | null",
    "mesAniversario": "MM ou null",
    "proximaDataReajuste": "YYYY-MM-DD ou null",
    "ultimoReajusteAplicado": "YYYY-MM-DD ou null",
    "percentualUltimoReajuste": número ou null
  },
  "prazos": {
    "dataInicio": "YYYY-MM-DD ou null",
    "dataFim": "YYYY-MM-DD ou null",
    "prazoMeses": número ou null,
    "carenciaMeses": número ou null,
    "proximaRevisional": "YYYY-MM-DD ou null"
  },
  "garantia": { "tipo": "fiança bancária | caução | seguro-fiança | null", "valor": número ou null, "validade": "YYYY-MM-DD ou null" },
  "camposAdicionais": [ { "rotulo": "rótulo do campo", "valor": "valor extraído", "grupo": "Identificação | Financeiro | Reajuste | Prazos | Garantias | Técnico | Compliance | Outros" } ],
  "clausulas": [ { "titulo": "título da cláusula relevante", "resumo": "o que ela determina" } ],
  "alertas": [ "riscos, vencimentos próximos, não conformidades ou dados faltantes" ],
  "tags": ["palavras-chave"],
  "confianca": número de 0 a 100
}

Use null quando não houver informação segura no documento — NUNCA invente dados. Preencha "camposAdicionais" com tudo mais que for relevante e não couber nos campos fixos (mínimo 4 itens quando o documento tiver conteúdo). Responda somente o JSON.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileBase64, fileName, taxonomy, assets } = await req.json()
    if (!fileBase64 || !fileName) {
      return new Response(JSON.stringify({ success: false, error: 'fileBase64 and fileName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) throw new Error('LOVABLE_API_KEY não configurada')

    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    const mediaType = isImage ? (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg') : 'application/pdf'
    const prompt = buildPrompt(taxonomy || '(não informada)', assets || '(não informados)')

    const contentBlock = isImage
      ? { type: 'image_url', image_url: { url: `data:${mediaType};base64,${fileBase64}` } }
      : { type: 'file', file: { filename: fileName, file_data: `data:${mediaType};base64,${fileBase64}` } }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }],
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI Gateway error:', response.status, errText)
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Créditos de IA insuficientes. Adicione créditos para continuar.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ success: false, error: 'Lovable AI bloqueada por política do workspace.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    console.error('analyze-document-ai error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
