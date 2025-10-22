# Sistema de Entrega por Drones

## 📋 Descrição
Sistema completo de simulação de entregas urbanas por drones. O sistema implementa algoritmos avançados de otimização para minimizar o número de viagens, respeitando regras de capacidade, alcance e prioridade.

## 🚀 Funcionalidades Implementadas

### ✅ Funcionalidades Obrigatórias
- **Sistema de Estados dos Drones**: IDLE → LOADING → FLYING → DELIVERING → RETURNING → RECHARGING
- **Mapeamento 2D da Cidade**: Grade de coordenadas visualizada em canvas
- **Sistema de Pedidos**: Localização (X,Y), peso e prioridade (alta, média, baixa)
- **Otimização de Rotas**: Algoritmo que minimiza o número de viagens
- **Validação de Entregas**: Verifica capacidade, alcance e bateria
- **Testes Unitários**: Cobertura completa das principais funcionalidades

### 🌟 Funcionalidades Avançadas
- **Sistema de Bateria**: Consumo por distância e recarga automática
- **Zonas Restritas**: Obstáculos no mapa que drones devem evitar
- **Cálculo de Tempo de Entrega**: Estimativa baseada em distância e velocidade
- **Fila de Prioridade**: Organização por prioridade + tempo de espera
- **Feedback do Cliente**: Mensagens simuladas após cada entrega
- **Dashboard em Tempo Real**: Estatísticas completas da operação

### 🎯 Diferenciais Implementados
1. **Otimização Inteligente**
   - Agrupamento de entregas por proximidade
   - Bin packing para otimizar capacidade
   - Algoritmo genético para rotas complexas
   - Nearest Neighbor para ordenação de rotas

2. **Simulação com Estados Completos**
   - Transições realistas entre estados
   - Animações visuais dos drones
   - Tempo simulado ajustável (1x-10x)

3. **Dashboard Completo**
   - Entregas realizadas/pendentes
   - Tempo médio de entrega
   - Distância total percorrida
   - Eficiência de combustível
   - Drone mais eficiente
   - Otimização de rotas em percentual

4. **Interface Visual Rica**
   - Mapa interativo com canvas
   - Status individual de cada drone
   - Fila de entregas com priorização visual
   - Log de eventos em tempo real
   - Feedback dos clientes

## 🛠️ Tecnologias Utilizadas
- **JavaScript** (ES6+)
- **HTML5** (Canvas API)
- **CSS3** (Grid, Flexbox, Animações)
- **Padrões**: MVC, Orientação a Objetos
- **Algoritmos**: A*, Nearest Neighbor, Bin Packing, Algoritmo Genético

## 📦 Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm (versão 6 ou superior)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Instalação e Execução

1. **Navegue até o diretório do projeto:**
```bash
cd drone-delivery-system
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Execute o projeto:**
```bash
npm start
```

4. **Acesse o sistema:**
- O navegador abrirá automaticamente em `http://localhost:8000`
- Se não abrir automaticamente, acesse manualmente: `http://localhost:8000`

### Comandos Disponíveis

```bash
# Iniciar o servidor
npm start

# Modo desenvolvimento (mesmo que start)
npm run dev

# Executar testes (no console do navegador)
npm test
```

### Estrutura de Arquivos

```
drone-delivery-system/
├── node_modules/       # Dependências (criado após npm install)
├── index.html          # Interface principal
├── styles.css          # Estilos e animações
├── drone.js            # Classe Drone com estados
├── optimizer.js        # Algoritmos de otimização
├── app.js              # Lógica principal
├── tests.js            # Testes unitários
├── server.js           # Servidor Express
├── package.json        # Configuração do projeto
├── package-lock.json   # Lock de dependências (criado após npm install)
└── README.md           # Documentação
```

## 🎮 Como Usar

### 1. Configuração Inicial
- Configure o número de drones (1-10)
- Ajuste a capacidade em kg (máximo por drone)
- Defina o alcance em km (distância máxima)
- Configure a bateria inicial (%)

### 2. Adicionar Pedidos
- Insira a localização X,Y (0-50)
- Defina o peso do pacote (0.1-10 kg)
- Escolha a prioridade (alta, média, baixa)
- Clique em "Adicionar Pedido"
- Ou use "Gerar 10 Pedidos Aleatórios" para teste rápido

### 3. Adicionar Zonas Restritas (Opcional)
- Defina o centro X,Y da zona
- Configure o raio em km
- Clique em "Adicionar Zona Restrita"

### 4. Controlar a Simulação
- **▶ Iniciar**: Começa a simulação
- **⏸ Pausar**: Pausa temporariamente
- **⏹ Resetar**: Reinicia tudo
- **Velocidade**: Ajuste de 1x a 10x

### 5. Monitoramento
- Observe os drones no mapa (triângulos coloridos)
- Acompanhe o status individual de cada drone
- Veja a fila de entregas sendo processada
- Monitore as estatísticas no dashboard
- Leia o feedback dos clientes

## 🧪 Testes

Os testes são executados automaticamente ao carregar a página. Para executar manualmente:

1. Abra o Console do navegador (F12)
2. Execute: `runTests()`

### Cobertura de Testes
- **Classe Drone**: 10 testes
  - Criação e configuração
  - Cálculo de distâncias
  - Validação de entregas
  - Consumo e recarga de bateria
  - Estados e transições

- **Otimizador**: 10 testes
  - Algoritmos de otimização
  - Agrupamento por proximidade
  - Bin packing
  - Cálculo de eficiência

- **Integração**: 5 testes
  - Ciclo completo de entrega
  - Múltiplos drones
  - Detecção de obstáculos
  - Retorno de emergência

- **Validação**: 5 testes
  - Limites de peso e distância
  - Coordenadas válidas
  - Estados permitidos

## 📊 Algoritmos de Otimização

### 1. Agrupamento por Proximidade
- Agrupa entregas próximas (< 5km) no mesmo drone
- Respeita capacidade máxima
- Máximo de 3 entregas por viagem

### 2. Bin Packing First Fit Decreasing
- Ordena entregas por peso (maior primeiro)
- Aloca em bins (drones) minimizando viagens
- Otimiza uso da capacidade

### 3. Nearest Neighbor
- Ordena entregas criando rota mais curta
- Reduz distância total percorrida
- Melhora eficiência de combustível

### 4. Algoritmo Genético (Rotas Complexas)
- População inicial de 50 rotas
- 100 gerações de evolução
- Crossover e mutação
- Fitness baseado em distância e prioridade

## 🎯 Critérios de Alocação

O sistema calcula um score para cada drone baseado em:
1. **Bateria disponível** (peso: 0.5)
2. **Eficiência histórica** (peso: 0.3)
3. **Distância até entregas** (penalidade: -2)
4. **Número de entregas no grupo** (bônus: +10)
5. **Prioridade das entregas** (bônus: +5)
6. **Utilização da capacidade** (peso: 0.2)

## 📈 Métricas de Performance

- **Entregas/Viagem**: Média de entregas por viagem
- **Eficiência**: Percentual de aproveitamento
- **Tempo Médio**: Tempo desde pedido até entrega
- **Distância/Entrega**: Otimização de rotas
- **Taxa de Bateria**: Consumo por km

## 🔧 Estrutura do Código

```
drone-delivery-system/
├── index.html          # Interface principal
├── styles.css          # Estilos e animações
├── drone.js           # Classe Drone com estados
├── optimizer.js       # Algoritmos de otimização
├── app.js            # Lógica principal
├── tests.js          # Testes unitários
└── README.md         # Documentação
```

## 💡 Decisões Técnicas

1. **Canvas para Visualização**: Melhor performance para animações
2. **POO para Drones**: Encapsulamento de estado e comportamento
3. **Event-Driven**: Simulação baseada em eventos e tempo
4. **Algoritmos Múltiplos**: Diferentes estratégias para diferentes cenários
5. **Testes Integrados**: Validação contínua durante desenvolvimento

## 🚁 Estados dos Drones

```
IDLE ──────> LOADING ──────> FLYING ──────> DELIVERING
  ↑                            │                │
  └──────── RECHARGING <───────┴── RETURNING <──┘
```

## 📝 Observações

- O sistema prioriza entregas de alta prioridade
- Drones retornam automaticamente quando bateria < 15%
- Recarga automática quando bateria < 30% ao chegar na base
- Zonas restritas forçam desvios nas rotas
- Feedback dos clientes é gerado aleatoriamente

## 🎨 Interface Visual

- **Azul**: Drone em voo
- **Verde**: Drone disponível
- **Laranja**: Drone recarregando
- **Vermelho**: Zona restrita
- **Triângulo**: Posição do drone
- **Círculo**: Entrega pendente
- **Quadrado "B"**: Base central

## 🏆 Resultados Esperados

Com a otimização implementada, o sistema consegue:
- Reduzir viagens em até 60% comparado a alocação simples
- Manter tempo médio de entrega < 15 minutos
- Eficiência de rota > 70%
- Taxa de sucesso de 100% nas entregas

## 👨‍💻 Autor
 
Marco

## 📨 Instruções de Envio (IMPORTANTE)


### 📦 Como Executar Localmente
```bash
# 1. Instalar dependências
npm install

# 2. Executar o projeto
npm start

# 3. Acessar no navegador
http://localhost:8000
```


  - Comando para executar: `npm install && npm start`

### ✅ Checklist de Entrega
- [ ] README com instruções
- [ ] Testes unitários funcionando
- [ ] Repositório público no GitHub
- [ ] `npm start` executando em localhost:8000

---

**Nota**: Este sistema é uma simulação para fins de demonstração técnica. Os algoritmos implementados são versões simplificadas de algoritmos reais usados em sistemas de logística.
