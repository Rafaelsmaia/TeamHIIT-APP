# Configuração da Calculadora de Calorias

A calculadora de calorias usa duas APIs:
- **Google Gemini** - Para identificar alimentos em imagens
- **FatSecret** - Para obter informações nutricionais

## 1. Configurar Google Gemini

### Obter API Key

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada

### Custo
- **Gratuito**: ~60 requisições/minuto no modelo Flash
- Ideal para uso pessoal e pequenos apps

## 2. Configurar FatSecret

### Obter Credenciais

1. Acesse [FatSecret Platform](https://platform.fatsecret.com/)
2. Crie uma conta gratuita
3. Vá em "My Apps" → "Create New App"
4. Escolha "REST API"
5. Anote o **Client ID** e **Client Secret**

### Custo
- **Gratuito**: Até 5.000 requisições/mês
- Suficiente para uso pessoal

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Google Gemini
VITE_GEMINI_API_KEY=sua_chave_aqui

# FatSecret
VITE_FATSECRET_CLIENT_ID=seu_client_id_aqui
VITE_FATSECRET_CLIENT_SECRET=seu_client_secret_aqui
```

## 4. Testar

1. Execute o projeto: `npm run dev`
2. Acesse o menu → "Calculadora de Calorias"
3. Tire uma foto de um alimento
4. Clique em "Analisar Alimentos"

## Troubleshooting

### Erro: "Chave da API do Gemini não configurada"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se a variável `VITE_GEMINI_API_KEY` está correta
- Reinicie o servidor de desenvolvimento

### Erro: "Credenciais do FatSecret não configuradas"
- Verifique as variáveis `VITE_FATSECRET_CLIENT_ID` e `VITE_FATSECRET_CLIENT_SECRET`
- Certifique-se de que copiou os valores corretos do painel do FatSecret

### Erro: "Permissão da câmera negada"
- Permita o acesso à câmera nas configurações do navegador
- Em dispositivos móveis, verifique as permissões do app

### Dados nutricionais não encontrados
- Alguns alimentos podem não estar na base do FatSecret
- Tente tirar uma foto mais clara do alimento
- Alimentos brasileiros específicos podem ter menos dados

## Fluxo de Funcionamento

```
📸 Usuário tira foto
      ↓
🤖 Gemini analisa a imagem
   - Identifica alimentos
   - Estima quantidades
      ↓
🍎 FatSecret busca nutrição
   - Calorias
   - Proteínas
   - Carboidratos
   - Gorduras
      ↓
📊 Exibe resultados
```

