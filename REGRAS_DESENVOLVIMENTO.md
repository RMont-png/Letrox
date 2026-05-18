# Regras de Desenvolvimento - Letrox

> [!IMPORTANT]
> **PROIBIÇÃO DE TESTES AUTOMATIZADOS NO NAVEGADOR**
> 
> Sob nenhuma circunstância o assistente de IA deve abrir o navegador ou executar testes automatizados de navegação (como `browser_subagent`) de forma autônoma. 
> 
> O fluxo de teste deve ser sempre delegado ao **USUÁRIO**, fornecendo instruções claras e objetivas de como realizar os testes manualmente.

## Diretrizes de Teste
1. **Sem Execução Autônoma de Navegador**: A IA não deve iniciar ferramentas de controle de navegador, abrir páginas web locais ou de produção, ou simular cliques por conta própria.
2. **Instruções de Teste ao Usuário**: A IA deve detalhar as etapas exatas que o usuário deve seguir para testar as novas implementações ou correções de bugs.
3. **Validação Manual**: O feedback visual e de jogabilidade deve ser relatado e confirmado pelo usuário.

