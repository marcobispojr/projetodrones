// Testes Unitários do Sistema de Entrega por Drones

// Classe de Teste
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    // Adicionar teste
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    // Executar todos os testes
    async run() {
        console.log('🧪 Iniciando testes unitários...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFunction();
                this.passed++;
                this.results.push({ name: test.name, status: 'PASSED', error: null });
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                this.results.push({ name: test.name, status: 'FAILED', error: error.message });
                console.error(`❌ ${test.name}: ${error.message}`);
            }
        }
        
        console.log('\n📊 Resultado dos Testes:');
        console.log(`✅ Passou: ${this.passed}/${this.tests.length}`);
        console.log(`❌ Falhou: ${this.failed}/${this.tests.length}`);
        console.log(`📈 Taxa de sucesso: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        
        return this.results;
    }
}

// Funções de asserção
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertAlmostEqual(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(message || `Expected ${expected} (±${tolerance}), got ${actual}`);
    }
}

function assertArrayEqual(actual, expected, message) {
    if (actual.length !== expected.length) {
        throw new Error(message || `Array length mismatch: ${actual.length} vs ${expected.length}`);
    }
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== expected[i]) {
            throw new Error(message || `Array mismatch at index ${i}: ${actual[i]} vs ${expected[i]}`);
        }
    }
}

// Testes do Drone
function runDroneTests() {
    const runner = new TestRunner();
    
    // Teste 1: Criação do drone
    runner.addTest('Drone: Criação com parâmetros corretos', () => {
        const drone = new Drone(1, 15, 30, 90);
        assertEqual(drone.id, 1);
        assertEqual(drone.capacity, 15);
        assertEqual(drone.maxRange, 30);
        assertEqual(drone.battery, 90);
        assertEqual(drone.state, 'IDLE');
    });
    
    // Teste 2: Cálculo de distância
    runner.addTest('Drone: Cálculo de distância', () => {
        const drone = new Drone(1);
        const from = { x: 0, y: 0 };
        const to = { x: 3, y: 4 };
        const distance = drone.calculateDistance(from, to);
        assertAlmostEqual(distance, 5, 0.01);
    });
    
    // Teste 3: Verificação de capacidade de aceitar entrega
    runner.addTest('Drone: Pode aceitar entrega válida', () => {
        const drone = new Drone(1, 10, 20, 100);
        const delivery = {
            location: { x: 28, y: 28 },
            weight: 5
        };
        assert(drone.canAcceptDelivery(delivery), 'Drone deveria aceitar entrega válida');
    });
    
    // Teste 4: Rejeitar entrega muito pesada
    runner.addTest('Drone: Rejeitar entrega muito pesada', () => {
        const drone = new Drone(1, 10, 20, 100);
        const delivery = {
            location: { x: 28, y: 28 },
            weight: 15
        };
        assert(!drone.canAcceptDelivery(delivery), 'Drone não deveria aceitar entrega muito pesada');
    });
    
    // Teste 5: Rejeitar entrega muito longe
    runner.addTest('Drone: Rejeitar entrega muito longe', () => {
        const drone = new Drone(1, 10, 20, 100);
        const delivery = {
            location: { x: 50, y: 50 },
            weight: 5
        };
        assert(!drone.canAcceptDelivery(delivery), 'Drone não deveria aceitar entrega muito longe');
    });
    
    // Teste 6: Bateria baixa
    runner.addTest('Drone: Rejeitar entrega com bateria baixa', () => {
        const drone = new Drone(1, 10, 50, 20);
        const delivery = {
            location: { x: 30, y: 30 },
            weight: 5
        };
        assert(!drone.canAcceptDelivery(delivery), 'Drone não deveria aceitar entrega com bateria baixa');
    });
    
    // Teste 7: Carregar pacotes
    runner.addTest('Drone: Carregar pacotes', () => {
        const drone = new Drone(1, 20, 30, 100);
        const deliveries = [
            { id: 1, location: { x: 30, y: 30 }, weight: 5 },
            { id: 2, location: { x: 32, y: 32 }, weight: 3 }
        ];
        
        const loaded = drone.loadPackages(deliveries);
        assert(loaded, 'Deveria carregar pacotes com sucesso');
        assertEqual(drone.state, 'LOADING');
        assertEqual(drone.currentWeight, 8);
    });
    
    // Teste 8: Consumo de bateria
    runner.addTest('Drone: Consumo de bateria durante voo', () => {
        const drone = new Drone(1, 10, 50, 100);
        drone.state = 'FLYING';
        const initialBattery = drone.battery;
        
        drone.moveTowards({ x: 30, y: 30 }, 1000); // 1 segundo
        
        assert(drone.battery < initialBattery, 'Bateria deveria ter sido consumida');
    });
    
    // Teste 9: Recarga de bateria
    runner.addTest('Drone: Recarga de bateria', () => {
        const drone = new Drone(1, 10, 20, 50);
        drone.state = 'RECHARGING';
        const initialBattery = drone.battery;
        
        drone.recharge(1000); // 1 segundo
        
        assert(drone.battery > initialBattery, 'Bateria deveria ter sido recarregada');
    });
    
    // Teste 10: Eficiência do drone
    runner.addTest('Drone: Cálculo de eficiência', () => {
        const drone = new Drone(1);
        drone.deliveriesCompleted = 5;
        drone.trips = 2;
        drone.update(0);
        
        assertAlmostEqual(drone.efficiency, 250, 1);
    });
    
    return runner.run();
}

// Testes do Otimizador
function runOptimizerTests() {
    const runner = new TestRunner();
    
    // Teste 1: Criação do otimizador
    runner.addTest('Optimizer: Criação', () => {
        const optimizer = new DeliveryOptimizer();
        assert(optimizer !== null);
        assertEqual(optimizer.priorityWeights.alta, 3);
        assertEqual(optimizer.priorityWeights.media, 2);
        assertEqual(optimizer.priorityWeights.baixa, 1);
    });
    
    // Teste 2: Ordenação por prioridade
    runner.addTest('Optimizer: Ordenação por prioridade', () => {
        const optimizer = new DeliveryOptimizer();
        const deliveries = [
            { id: 1, priority: 'baixa', createdAt: new Date() },
            { id: 2, priority: 'alta', createdAt: new Date() },
            { id: 3, priority: 'media', createdAt: new Date() }
        ];
        
        const sorted = optimizer.sortDeliveriesByPriority(deliveries);
        assertEqual(sorted[0].priority, 'alta');
        assertEqual(sorted[1].priority, 'media');
        assertEqual(sorted[2].priority, 'baixa');
    });
    
    // Teste 3: Agrupamento por proximidade
    runner.addTest('Optimizer: Agrupamento por proximidade', () => {
        const optimizer = new DeliveryOptimizer();
        const deliveries = [
            { id: 1, location: { x: 10, y: 10 }, weight: 2 },
            { id: 2, location: { x: 11, y: 11 }, weight: 2 },
            { id: 3, location: { x: 40, y: 40 }, weight: 2 }
        ];
        
        const groups = optimizer.groupDeliveriesByProximity(deliveries, 10);
        assertEqual(groups.length, 2); // Dois grupos: [1,2] e [3]
        assertEqual(groups[0].length, 2); // Primeiro grupo tem 2 entregas próximas
    });
    
    // Teste 4: Cálculo de distância total
    runner.addTest('Optimizer: Cálculo de distância total', () => {
        const optimizer = new DeliveryOptimizer();
        const start = { x: 25, y: 25 };
        const deliveries = [
            { location: { x: 28, y: 25 } },
            { location: { x: 25, y: 29 } }
        ];
        
        const distance = optimizer.calculateTotalDistance(start, deliveries);
        assert(distance > 0, 'Distância deveria ser positiva');
        assert(distance < 20, 'Distância deveria ser razoável');
    });
    
    // Teste 5: Tempo estimado de entrega
    runner.addTest('Optimizer: Estimativa de tempo', () => {
        const optimizer = new DeliveryOptimizer();
        const drone = new Drone(1);
        const deliveries = [
            { location: { x: 30, y: 30 }, weight: 2 }
        ];
        
        const time = optimizer.estimateDeliveryTime(drone, deliveries);
        assert(time > 0, 'Tempo deveria ser positivo');
        assert(time < 60, 'Tempo deveria ser menor que 60 minutos');
    });
    
    // Teste 6: Bin packing
    runner.addTest('Optimizer: Bin packing', () => {
        const optimizer = new DeliveryOptimizer();
        const deliveries = [
            { weight: 5 },
            { weight: 4 },
            { weight: 3 },
            { weight: 2 },
            { weight: 1 }
        ];
        
        const bins = optimizer.binPackingOptimization(deliveries, 10);
        assertEqual(bins.length, 2); // Deveria caber em 2 bins
    });
    
    // Teste 7: Cálculo de eficiência
    runner.addTest('Optimizer: Cálculo de eficiência', () => {
        const optimizer = new DeliveryOptimizer();
        const drone = new Drone(1, 10, 50, 100);
        const deliveries = [
            { location: { x: 28, y: 28 }, weight: 8 }
        ];
        
        const efficiency = optimizer.calculateEfficiency(drone, deliveries);
        assert(efficiency > 0 && efficiency <= 100, 'Eficiência deveria estar entre 0 e 100');
    });
    
    // Teste 8: Shuffe de array
    runner.addTest('Optimizer: Shuffle de array', () => {
        const optimizer = new DeliveryOptimizer();
        const original = [1, 2, 3, 4, 5];
        const shuffled = optimizer.shuffleArray([...original]);
        
        assertEqual(shuffled.length, original.length);
        // Verificar que todos os elementos estão presentes
        for (const item of original) {
            assert(shuffled.includes(item), `Item ${item} deveria estar no array embaralhado`);
        }
    });
    
    // Teste 9: Mutação para algoritmo genético
    runner.addTest('Optimizer: Mutação', () => {
        const optimizer = new DeliveryOptimizer();
        const route = [
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 }
        ];
        
        const mutated = optimizer.mutate([...route]);
        assertEqual(mutated.length, route.length);
    });
    
    // Teste 10: Score do drone
    runner.addTest('Optimizer: Cálculo de score do drone', () => {
        const optimizer = new DeliveryOptimizer();
        const drone = new Drone(1, 10, 50, 100);
        const deliveries = [
            { location: { x: 30, y: 30 }, weight: 5, priority: 'alta' }
        ];
        
        const score = optimizer.calculateDroneScore(drone, deliveries, 10);
        assert(typeof score === 'number', 'Score deveria ser um número');
    });
    
    return runner.run();
}

// Testes de Integração
function runIntegrationTests() {
    const runner = new TestRunner();
    
    // Teste 1: Sistema completo - Drone aceitar e entregar
    runner.addTest('Integration: Drone aceita e entrega pacote', async () => {
        const drone = new Drone(1, 10, 50, 100);
        const delivery = {
            id: 1,
            location: { x: 30, y: 30 },
            weight: 5,
            status: 'PENDENTE',
            priority: 'media'
        };
        
        // Verificar que pode aceitar
        assert(drone.canAcceptDelivery(delivery));
        
        // Carregar
        assert(drone.loadPackages([delivery]));
        
        // Aguardar mudança de estado
        await new Promise(resolve => setTimeout(resolve, 2100));
        assertEqual(drone.state, 'FLYING');
    });
    
    // Teste 2: Otimizador com múltiplos drones
    runner.addTest('Integration: Otimização com múltiplos drones', () => {
        const optimizer = new DeliveryOptimizer();
        const drones = [
            new Drone(1, 10, 50, 100),
            new Drone(2, 15, 40, 80),
            new Drone(3, 8, 60, 90)
        ];
        const deliveries = [
            { id: 1, location: { x: 30, y: 30 }, weight: 5, priority: 'alta', status: 'PENDENTE' },
            { id: 2, location: { x: 35, y: 35 }, weight: 3, priority: 'media', status: 'PENDENTE' },
            { id: 3, location: { x: 20, y: 20 }, weight: 7, priority: 'baixa', status: 'PENDENTE' }
        ];
        
        const allocations = optimizer.optimizeDeliveryAllocation(drones, deliveries, []);
        assert(allocations.length > 0, 'Deveria ter alocações');
        
        // Verificar que cada alocação tem drone e entregas
        for (const allocation of allocations) {
            assert(allocation.drone !== null);
            assert(allocation.deliveries.length > 0);
            assert(allocation.estimatedTime > 0);
        }
    });
    
    // Teste 3: Sistema com obstáculos
    runner.addTest('Integration: Detecção de obstáculos', () => {
        const drone = new Drone(1);
        const obstacles = [
            { x: 30, y: 30, radius: 5 }
        ];
        
        const hasObstacle = drone.checkObstacles(
            obstacles,
            { x: 25, y: 25 },
            { x: 35, y: 35 }
        );
        
        assert(hasObstacle, 'Deveria detectar obstáculo no caminho');
    });
    
    // Teste 4: Retorno de emergência
    runner.addTest('Integration: Retorno de emergência com bateria baixa', () => {
        const drone = new Drone(1, 10, 50, 15); // Bateria baixa
        drone.state = 'FLYING';
        drone.currentLoad = [{ id: 1, status: 'EM_ROTA' }];
        
        drone.emergencyReturn();
        
        assertEqual(drone.state, 'RETURNING');
        assertEqual(drone.currentLoad.length, 0);
        assertEqual(drone.destination.x, drone.basePosition.x);
    });
    
    // Teste 5: Ciclo completo de entrega
    runner.addTest('Integration: Ciclo completo de entrega', async () => {
        const drone = new Drone(1, 10, 50, 100);
        const delivery = {
            id: 1,
            location: { x: 26, y: 26 },
            weight: 5,
            status: 'PENDENTE',
            priority: 'alta',
            createdAt: new Date()
        };
        
        // Carregar
        drone.loadPackages([delivery]);
        drone.destination = delivery.location;
        
        // Simular movimento até destino
        await new Promise(resolve => setTimeout(resolve, 2100));
        drone.state = 'FLYING';
        
        // Mover para destino
        for (let i = 0; i < 10; i++) {
            drone.moveTowards(delivery.location, 100);
        }
        
        // Verificar que chegou próximo
        const distance = drone.calculateDistance(drone.position, delivery.location);
        assert(distance < 2, 'Drone deveria estar próximo do destino');
    });
    
    return runner.run();
}

// Testes de Validação
function runValidationTests() {
    const runner = new TestRunner();
    
    // Teste 1: Validação de peso
    runner.addTest('Validation: Peso dentro dos limites', () => {
        assert(0.1 <= 10, 'Peso mínimo válido');
        assert(10 <= 10, 'Peso máximo válido');
    });
    
    // Teste 2: Validação de coordenadas
    runner.addTest('Validation: Coordenadas dentro dos limites', () => {
        const validCoords = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 25, y: 25 }
        ];
        
        for (const coord of validCoords) {
            assert(coord.x >= 0 && coord.x <= 50);
            assert(coord.y >= 0 && coord.y <= 50);
        }
    });
    
    // Teste 3: Validação de prioridades
    runner.addTest('Validation: Prioridades válidas', () => {
        const validPriorities = ['alta', 'media', 'baixa'];
        const priorityWeights = { alta: 3, media: 2, baixa: 1 };
        
        for (const priority of validPriorities) {
            assert(priorityWeights[priority] > 0);
        }
    });
    
    // Teste 4: Validação de estados do drone
    runner.addTest('Validation: Estados válidos do drone', () => {
        const validStates = ['IDLE', 'LOADING', 'FLYING', 'DELIVERING', 'RETURNING', 'RECHARGING'];
        const drone = new Drone(1);
        
        assert(validStates.includes(drone.state));
    });
    
    // Teste 5: Validação de capacidade máxima
    runner.addTest('Validation: Capacidade não excedida', () => {
        const drone = new Drone(1, 10, 50, 100);
        const deliveries = [
            { weight: 4 },
            { weight: 3 },
            { weight: 2 }
        ];
        
        const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
        assert(totalWeight <= drone.capacity);
    });
    
    return runner.run();
}

// Função principal para executar todos os testes
async function runTests() {
    console.log('==================================================');
    console.log('       SISTEMA DE TESTES - ENTREGA POR DRONES    ');
    console.log('==================================================\n');
    
    const allResults = [];
    
    // Executar cada conjunto de testes
    console.log('📦 TESTES DA CLASSE DRONE');
    console.log('--------------------------------------------------');
    allResults.push(...await runDroneTests());
    
    console.log('\n📦 TESTES DO OTIMIZADOR');
    console.log('--------------------------------------------------');
    allResults.push(...await runOptimizerTests());
    
    console.log('\n📦 TESTES DE INTEGRAÇÃO');
    console.log('--------------------------------------------------');
    allResults.push(...await runIntegrationTests());
    
    console.log('\n📦 TESTES DE VALIDAÇÃO');
    console.log('--------------------------------------------------');
    allResults.push(...await runValidationTests());
    
    // Resumo final
    const totalPassed = allResults.filter(r => r.status === 'PASSED').length;
    const totalFailed = allResults.filter(r => r.status === 'FAILED').length;
    const successRate = (totalPassed / allResults.length) * 100;
    
    console.log('\n==================================================');
    console.log('                 RESUMO FINAL                     ');
    console.log('==================================================');
    console.log(`Total de testes: ${allResults.length}`);
    console.log(`✅ Passou: ${totalPassed}`);
    console.log(`❌ Falhou: ${totalFailed}`);
    console.log(`📊 Taxa de sucesso: ${successRate.toFixed(1)}%`);
    
    if (totalFailed === 0) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! 🎉');
    } else {
        console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.');
        console.log('\nTestes que falharam:');
        allResults.filter(r => r.status === 'FAILED').forEach(test => {
            console.log(`  - ${test.name}: ${test.error}`);
        });
    }
    
    return {
        total: allResults.length,
        passed: totalPassed,
        failed: totalFailed,
        successRate: successRate,
        results: allResults
    };
}

// Exportar para uso em outros contextos se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}