# Painel de Controle Admin - Team HIIT

## Estrutura Modular para Migração Futura

Esta pasta contém toda a estrutura do painel administrativo, organizada de forma que pode ser facilmente migrada para um projeto separado no futuro.

## Estrutura de Pastas

```
admin/
├── components/          # Componentes específicos do admin
├── pages/              # Páginas do painel
├── hooks/              # Hooks específicos do admin
├── services/           # Serviços administrativos
├── utils/              # Utilitários do admin
├── routes.jsx         # Rotas do admin (isoladas)
└── AdminLayout.jsx    # Layout base do admin
```

## Dependências Externas

### Compartilhadas (precisarão ser copiadas na migração):
- `src/firebaseConfig.js` - Configuração do Firebase
- `src/config/` - Configurações gerais
- `src/utils/dateUtils.js` - Utilitários de data

### Componentes UI Compartilhados (opcional):
- `src/components/ui/` - Pode ser copiado ou substituído

## Como Migrar para Projeto Separado

1. **Copiar pasta `admin/` completa**
2. **Copiar dependências necessárias:**
   - `firebaseConfig.js`
   - Configurações do Firebase
   - Utilitários compartilhados
3. **Criar novo projeto React/Vite**
4. **Instalar dependências:** Firebase, React Router, Tailwind, etc.
5. **Ajustar imports** para nova estrutura
6. **Configurar Firebase** com mesmas credenciais

## Tempo Estimado de Migração

- **Estrutura modular:** 2-4 horas
- **Estrutura acoplada:** 1-2 dias

## Vantagens desta Estrutura

✅ Isolamento claro do código admin
✅ Fácil identificação de dependências
✅ Migração simplificada
✅ Manutenção mais fácil
✅ Testes isolados possíveis
