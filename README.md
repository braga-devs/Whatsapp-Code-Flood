# Flood Crash System

> Sistema para solicitação múltipla de códigos de pareamento WhatsApp via Termux.

---

## <i class="fas fa-list-check"></i> Requisitos

- Android com Termux
- Conexão com internet
- Número de WhatsApp válido
- Node.js LTS

---

## <i class="fas fa-download"></i> Instalação

### Atualizar pacotes

```bash
pkg update && pkg upgrade -y
```

### Instalar Node.js

```bash
pkg install nodejs-lts -y
```

### Instalar Git

```bash
pkg install git -y
```

### Instalar dependências

```bash
npm init -y
npm install @whiskeysockets/baileys pino
```

---

## <i class="fas fa-play"></i> Como Utilizar

Execute o sistema:

```bash
node main.js
```

### Fluxo de Uso

1. Digite o número com DDI e DDD.
2. Informe a quantidade de códigos.
3. Aguarde o processamento.
4. Visualize os resultados no terminal.

**Exemplo de número:**

```text
5511999999999
```

---

## <i class="fas fa-bars"></i> Menu de Opções

| Opção | Descrição |
|--------|------------|
| 1 | Executar novamente |
| 2 | Encerrar sistema |

---

## <i class="fas fa-folder-open"></i> Permissões do Termux

Opcional:

```bash
termux-setup-storage
```

---

## <i class="fas fa-wrench"></i> Solução de Problemas

### Cannot find module

```bash
npm install @whiskeysockets/baileys pino --save
```

### Erro de permissão

```bash
chmod +x main.js
```

---

## <i class="fas fa-terminal"></i> Comandos Úteis

### Parar execução

```bash
Ctrl + C
```

### Limpar terminal

```bash
clear
```

### Verificar versão do Node.js

```bash
node --version
```

### Remover o projeto

```bash
cd ..
rm -rf flood-crash-system
```

---

## <i class="fas fa-circle-info"></i> Observações

- Utilize uma conexão estável durante a execução.
- Mantenha as dependências atualizadas.
- Recomenda-se utilizar a versão LTS do Node.js.

---

<div align="center">

### Flood Crash System

Desenvolvido para ambiente Termux.

</div>
