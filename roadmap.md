# Roadmap

## Super Admin x Natalia — visões separadas, base única (em andamento)

- [x] Criar store único (portfolio-store + PortfolioProvider) com Ativos > Andares > Conjuntos > Locatário > Contrato > IPTU
- [x] Chucri Zaidan 100% preenchido (17 conjuntos, locatários, contratos, garantias, reajustes, revisionais, IPTU; conjunto 71 vago p/ teste IA)
- [x] Remover 360JK/You/Capitale/Lux da visão Super Admin; dados antigos reapontados para ativos HGRE11
- [x] Mapa do Ativo do Super Admin substituído pelo Stacking Plan da visão da Natalia (mesma base)
- [x] Contratos do Super Admin convertidos em prestadores de serviço do edifício (limpeza, segurança, elevadores etc.)
- [x] Renomear módulo "Financeiro" do Super Admin para "Administrativo"; título "Financeiro — IPMS" virou "Financeiro"
- [x] Contratos (Natalia): status "Inativo" manual + filtro; ordenação por conjunto crescente/decrescente
- [x] Gráficos "Mês de Reajuste" (aba Reajustes) e "Concentração das Revisionais" (aba Revisionais) no padrão Patria
- [ ] Contrato via leitura de IA: migrar analyze-document-ai para openai/gpt-6-astra (Responses, streaming) + tela de revisão com seleção de ativo/andar/conjunto (teste: Chucri Zaidan 7º andar)
- [ ] IPTU por conjunto (matrículas, devedor = locatário, histórico) alimentado pelo store
- [ ] "Adicionar Ativo/Locatário/Contrato" gravando no store compartilhado (refletir nas duas visões)
- [x] Receita por Estado inclui SP, RS e RJ; referência do Chucri Zaidan ajustada para R$ 110/m²
- [x] Alertas fiscais do IPTU convertidos em painel lateral rolável
