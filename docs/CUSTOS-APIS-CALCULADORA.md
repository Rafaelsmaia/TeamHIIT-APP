# Comparação de Custos: APIs para Calculadora de Calorias

## Opção 1: Clarifai + Edamam (Implementação Atual)

### Clarifai
- **Plano Gratuito**: 5.000 requisições/mês
- **Custo**: $0 (até o limite)
- **Após o limite**: Preços sob consulta

### Edamam
- **Food Database API**: Requer assinatura mensal obrigatória
  - **Enterprise Basic Vision**: $14/mês (com 30 dias de trial)
  - **Enterprise Core**: $69/mês
  - **Enterprise Plus**: $299/mês
  - **Enterprise Unlimited (Custom)**: Preço sob consulta
- **Nutrition Analysis API**: A partir de $29/mês
- **Custo mínimo**: **$14/mês** (plano mais barato)

**Total Estimado (uso moderado)**: **$14-69/mês** (dependendo do plano)

---

## Opção 2: Gemini + FatSecret (Como o Calorify)

### Google Gemini API

#### Modelo Gemini 2.0 Flash (Recomendado para imagens)
- **Entrada (Imagem + Texto)**: $0.10 por milhão de tokens
- **Saída (Texto)**: $0.40 por milhão de tokens
- **Custo por imagem**: ~$0.005 por imagem (estimado)

#### Modelo Gemini 2.5 Pro (Mais preciso)
- **Entrada**: $1.25 por milhão de tokens
- **Saída**: $10.00 por milhão de tokens
- **Custo por imagem**: ~$0.01-0.02 por imagem (estimado)

### FatSecret API

#### Edição Básica (Gratuita)
- **Limite**: 5.000 chamadas/dia (150.000/mês)
- **Acesso**: Apenas banco de dados dos EUA
- **Custo**: **$0**

#### Edição Premier (Gratuita para Startups/NPOs)
- **Limite**: Ilimitado
- **Acesso**: Mais de 56 países
- **Custo**: **$0** (com verificação)
- **Para empresas**: Preço sob consulta

**Total Estimado (uso moderado)**: 
- **Gemini 2.0 Flash**: ~$0.50 - $2.00/mês (100-400 imagens)
- **Gemini 2.5 Pro**: ~$1.00 - $8.00/mês (100-400 imagens)
- **FatSecret**: **$0** (dentro do plano gratuito)

---

## Comparação de Custos Mensais

| Volume de Uso | Clarifai + Edamam | Gemini Flash + FatSecret | Gemini Pro + FatSecret |
|---------------|-------------------|--------------------------|------------------------|
| 100 imagens/mês | $14-69/mês* | ~$0.50 | ~$1.00 |
| 500 imagens/mês | $14-69/mês* | ~$2.50 | ~$5.00 |
| 1.000 imagens/mês | $14-69/mês* | ~$5.00 | ~$10.00 |
| 5.000 imagens/mês | $14-299/mês* | ~$25.00 | ~$50.00 |

*Edamam requer assinatura mensal obrigatória (mínimo $14/mês)

---

## Análise de Custos

### Para Uso Baixo/Moderado (< 1.000 imagens/mês)
- **Melhor opção**: Gemini Flash + FatSecret = **~$0.50-5.00/mês**
- **Alternativa**: Clarifai + Edamam = **$14-69/mês** (assinatura obrigatória)

### Para Uso Alto (> 5.000 imagens/mês)
- **Gemini Flash + FatSecret**: ~$25-50/mês (mais previsível)
- **Clarifai + Edamam**: $14-299/mês (dependendo do plano)

### Vantagens de Cada Opção

#### Clarifai + Edamam
✅ Já implementado  
✅ Edamam tem banco de dados nutricional amplo  
❌ **Requer assinatura mensal obrigatória** ($14-69/mês mínimo)  
❌ Não identifica porções automaticamente  
❌ Custo fixo mensal independente do uso

#### Gemini + FatSecret
✅ Identifica porções automaticamente  
✅ Maior precisão  
✅ Preços transparentes e escaláveis  
✅ FatSecret gratuito ilimitado (com verificação)  
❌ Custo adicional do Gemini  
❌ Precisa implementar

---

## Recomendação

### Se você quer **menor custo**:
→ Use **Gemini 2.0 Flash + FatSecret** (~$0.50-5.00/mês para uso moderado)
→ **Mais barato** que Edamam ($14/mês mínimo)

### Se você quer **qualidade como o Calorify**:
→ Use **Gemini 2.0 Flash + FatSecret** (~$0.50-5.00/mês)

### Se você já tem **Edamam implementado**:
→ Considere migrar para **Gemini + FatSecret** para economizar
→ Edamam custa $14-69/mês fixo vs Gemini que é pay-per-use

---

## Links Úteis

- [FatSecret API Pricing](https://platform.fatsecret.com/api-editions)
- [Google Gemini API Pricing](https://ai.google.dev/pricing)
- [Clarifai Pricing](https://www.clarifai.com/pricing)
- [Edamam Pricing](https://developer.edamam.com/pricing)

---

## Nota Importante

Os preços podem variar e devem ser verificados diretamente nos sites oficiais. Esta é uma estimativa baseada em informações disponíveis em 2024.

