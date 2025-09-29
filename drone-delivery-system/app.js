// Aplicação principal do sistema de entrega por drones
let drones = [];
let deliveries = [];
let optimizer = null;
let simulationRunning = false;
let simulationTime = 0;
let lastUpdateTime = Date.now();
let deliveryIdCounter = 1;
let stats = {
    deliveriesCompleted: 0,
    deliveriesPending: 0,
    totalDistance: 0,
    totalTrips: 0,
    avgDeliveryTime: 0,
    fuelEfficiency: 100,
    bestDrone: '-',
    routeOptimization: 0
};

// Canvas e contexto
let canvas = null;
let ctx = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    initializeCanvas();
    updateDisplay();
    startRenderLoop();
    
    // Configurar slider de velocidade
    document.getElementById('simulation-speed').addEventListener('input', function() {
        document.getElementById('speed-display').textContent = this.value + 'x';
    });
    
    // Executar testes ao carregar
    if (typeof runTests === 'function') {
        console.log('Executando testes unitários...');
        runTests();
    }
});

// Inicializar sistema
function initializeSystem() {
    optimizer = new DeliveryOptimizer();
    
    // Criar drones iniciais
    const droneCount = parseInt(document.getElementById('drone-count').value);
    const capacity = parseFloat(document.getElementById('drone-capacity').value);
    const range = parseFloat(document.getElementById('drone-range').value);
    const battery = parseFloat(document.getElementById('drone-battery').value);
    
    drones = [];
    for (let i = 0; i < droneCount; i++) {
        const drone = new Drone(i + 1, capacity, range, battery);
        // Posicionar drones ao redor da base
        if (droneCount > 1) {
            const angle = (i * 2 * Math.PI) / droneCount;
            drone.position.x = 25 + Math.cos(angle) * 2;
            drone.position.y = 25 + Math.sin(angle) * 2;
        }
        drones.push(drone);
    }
    
    addEventLog('🚁 Sistema inicializado com ' + droneCount + ' drone(s)', 'info');
}

// Inicializar canvas
function initializeCanvas() {
    canvas = document.getElementById('city-map');
    ctx = canvas.getContext('2d');
}

// Atualizar configuração dos drones
function updateDroneConfig() {
    const droneCount = parseInt(document.getElementById('drone-count').value);
    const capacity = parseFloat(document.getElementById('drone-capacity').value);
    const range = parseFloat(document.getElementById('drone-range').value);
    const battery = parseFloat(document.getElementById('drone-battery').value);
    
    // Manter drones existentes se possível
    const existingCount = drones.length;
    
    if (droneCount > existingCount) {
        // Adicionar novos drones
        for (let i = existingCount; i < droneCount; i++) {
            const newDrone = new Drone(i + 1, capacity, range, battery);
            // Posicionar drones em círculo ao redor da base
            const angle = (i * 2 * Math.PI) / droneCount;
            newDrone.position.x = 25 + Math.cos(angle) * 3;
            newDrone.position.y = 25 + Math.sin(angle) * 3;
            drones.push(newDrone);
        }
    } else if (droneCount < existingCount) {
        // Remover drones extras
        drones = drones.slice(0, droneCount);
    }
    
    // Atualizar configurações dos drones existentes
    drones.forEach((drone, index) => {
        drone.capacity = capacity;
        drone.maxRange = range;
        if (drone.state === 'IDLE') {
            drone.battery = battery;
        }
    });
    
    addEventLog(`⚙️ Configuração atualizada: ${droneCount} drone(s)`, 'info');
    updateDisplay();
}

// Adicionar nova entrega
function addDelivery() {
    const x = parseFloat(document.getElementById('delivery-x').value);
    const y = parseFloat(document.getElementById('delivery-y').value);
    const weight = parseFloat(document.getElementById('delivery-weight').value);
    const priority = document.getElementById('delivery-priority').value;
    
    if (isNaN(x) || isNaN(y) || isNaN(weight)) {
        addEventLog('❌ Por favor, preencha todos os campos corretamente', 'error');
        return;
    }
    
    if (x < 0 || x > 50 || y < 0 || y > 50) {
        addEventLog('❌ Localização deve estar entre 0 e 50', 'error');
        return;
    }
    
    if (weight <= 0 || weight > 10) {
        addEventLog('❌ Peso deve estar entre 0.1 e 10 kg', 'error');
        return;
    }
    
    const delivery = {
        id: deliveryIdCounter++,
        location: { x, y },
        weight: weight,
        priority: priority,
        status: 'PENDENTE',
        createdAt: new Date(),
        estimatedTime: null,
        deliveredBy: null,
        deliveryTime: null
    };
    
    deliveries.push(delivery);
    
    // Tentar alocar imediatamente se a simulação estiver rodando
    if (simulationRunning) {
        tryAllocateDeliveries();
    }
    
    addEventLog(`📦 Novo pedido #${delivery.id} adicionado (${priority})`, 'success');
    updateDisplay();
    
    // Limpar formulário
    document.getElementById('delivery-x').value = '';
    document.getElementById('delivery-y').value = '';
    document.getElementById('delivery-weight').value = '';
}

// Gerar entregas aleatórias
function generateRandomDeliveries() {
    const priorities = ['baixa', 'media', 'alta'];
    
    for (let i = 0; i < 10; i++) {
        const delivery = {
            id: deliveryIdCounter++,
            location: {
                x: Math.random() * 45 + 2.5,
                y: Math.random() * 45 + 2.5
            },
            weight: Math.random() * 9 + 1,
            priority: priorities[Math.floor(Math.random() * 3)],
            status: 'PENDENTE',
            createdAt: new Date(),
            estimatedTime: null,
            deliveredBy: null,
            deliveryTime: null
        };
        
        deliveries.push(delivery);
    }
    
    if (simulationRunning) {
        tryAllocateDeliveries();
    }
    
    addEventLog('📦 10 pedidos aleatórios gerados', 'success');
    updateDisplay();
}



// Tentar alocar entregas aos drones
function tryAllocateDeliveries() {
    const pendingDeliveries = deliveries.filter(d => d.status === 'PENDENTE');
    if (pendingDeliveries.length === 0) return;
    
    const availableDrones = drones.filter(d => d.state === 'IDLE' && d.battery > 30);
    if (availableDrones.length === 0) return;
    
    // Ordenar entregas por prioridade
    const sortedDeliveries = pendingDeliveries.sort((a, b) => {
        const priorityOrder = { alta: 0, media: 1, baixa: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // REGRA: Cada drone pega UMA entrega
    // Se tem 2 entregas e 3 drones → 2 drones saem
    // Se tem 3 entregas e 3 drones → 3 drones saem
    let allocatedCount = 0;
    const maxAllocations = Math.min(availableDrones.length, sortedDeliveries.length);
    
    for (let i = 0; i < maxAllocations; i++) {
        const drone = availableDrones[i];
        const delivery = sortedDeliveries[i];
        
        // Verificar se o drone pode aceitar esta entrega
        if (drone.canAcceptDelivery(delivery)) {
            // Marcar entrega como em rota
            delivery.status = 'EM_ROTA';
            
            // Carregar no drone
            drone.loadPackages([delivery]);
            drone.destination = delivery.location;
            
            addEventLog(
                `🚁 Drone ${drone.id} → Pedido #${delivery.id} (${delivery.priority}) em (${delivery.location.x.toFixed(0)}, ${delivery.location.y.toFixed(0)})`,
                'info'
            );
            
            allocatedCount++;
        }
    }
    
    // Log de resumo
    if (allocatedCount > 0) {
        addEventLog(
            `✅ ${allocatedCount} drone(s) despachado(s) para coleta`,
            'success'
        );
    }
    
    // Atualizar display
    updateDisplay();
}

// Iniciar simulação
function startSimulation() {
    if (simulationRunning) return;
    
    simulationRunning = true;
    document.getElementById('simulation-status').textContent = 'Em Execução';
    document.getElementById('simulation-status').className = 'status-running';
    
    addEventLog('▶️ Simulação iniciada', 'success');
    
    // Tentar alocar entregas pendentes
    tryAllocateDeliveries();
}

// Pausar simulação
function pauseSimulation() {
    simulationRunning = false;
    document.getElementById('simulation-status').textContent = 'Pausado';
    document.getElementById('simulation-status').className = 'status-paused';
    
    addEventLog('⏸ Simulação pausada', 'warning');
}

// Resetar simulação
function resetSimulation() {
    simulationRunning = false;
    simulationTime = 0;
    deliveries = [];
    deliveryIdCounter = 1;
    
    document.getElementById('simulation-status').textContent = 'Parado';
    document.getElementById('simulation-status').className = 'status-stopped';
    
    // Resetar drones
    initializeSystem();
    
    // Resetar estatísticas
    stats = {
        deliveriesCompleted: 0,
        deliveriesPending: 0,
        totalDistance: 0,
        totalTrips: 0,
        avgDeliveryTime: 0,
        fuelEfficiency: 100,
        bestDrone: '-',
        routeOptimization: 0
    };
    
    // Limpar logs
    document.getElementById('event-log-list').innerHTML = '';
    document.getElementById('customer-feedback-list').innerHTML = '';
    
    addEventLog('⏹ Simulação resetada', 'info');
    updateDisplay();
}

// Loop principal de renderização
function startRenderLoop() {
    function update() {
        const now = Date.now();
        const deltaTime = now - lastUpdateTime;
        lastUpdateTime = now;
        
        if (simulationRunning) {
            const speed = parseInt(document.getElementById('simulation-speed').value);
            const adjustedDelta = deltaTime * speed;
            
            simulationTime += adjustedDelta;
            
            // Atualizar todos os drones
            drones.forEach(drone => {
                drone.update(adjustedDelta);
            });
            
            // Tentar alocar entregas SEMPRE que houver pendentes e drones disponíveis
            const hasPendingDeliveries = deliveries.some(d => d.status === 'PENDENTE');
            const hasAvailableDrones = drones.some(d => d.state === 'IDLE' && d.battery > 30);
            
            if (hasPendingDeliveries && hasAvailableDrones) {
                // Tentar a cada 1 segundo (1000ms)
                if (Math.floor(simulationTime / 1000) > Math.floor((simulationTime - adjustedDelta) / 1000)) {
                    tryAllocateDeliveries();
                }
            }
            
            updateDisplay();
        }
        
        // Sempre renderizar o mapa
        renderMap();
        
        requestAnimationFrame(update);
    }
    
    update();
}

// Renderizar mapa
function renderMap() {
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grade de fundo
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const pos = i * 60;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, 600);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(600, pos);
        ctx.stroke();
    }
    
    // Desenhar base (centro)
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(290, 290, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('B', 296, 304);
    
    // Desenhar TODAS as entregas (pendentes, em rota e coletadas)
    deliveries.filter(d => d.status === 'PENDENTE' || d.status === 'EM_ROTA' || d.status === 'COLETADO').forEach(delivery => {
        const x = delivery.location.x * 12;
        const y = delivery.location.y * 12;
        
        // Cor baseada na prioridade e status
        if (delivery.status === 'EM_ROTA') {
            ctx.fillStyle = delivery.priority === 'alta' ? '#c53030' :
                           delivery.priority === 'media' ? '#dd6b20' : '#38a169';
        } else {
            ctx.fillStyle = delivery.priority === 'alta' ? '#e53e3e' :
                           delivery.priority === 'media' ? '#ed8936' : '#48bb78';
        }
        
        // Desenhar pacote
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Adicionar borda se está em rota
        if (delivery.status === 'EM_ROTA') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // ID do pedido
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Arial';
        ctx.fillText(delivery.id.toString(), x - 3, y + 2);
    });
    
    // Desenhar TODOS os drones
    drones.forEach((drone, index) => {
        const x = drone.position.x * 12;
        const y = drone.position.y * 12;
        
        // Cor baseada no estado
        if (drone.state === 'IDLE') {
            ctx.fillStyle = '#48bb78';
        } else if (drone.state === 'RECHARGING') {
            ctx.fillStyle = '#ed8936';
        } else if (drone.state === 'FLYING' || drone.state === 'RETURNING') {
            ctx.fillStyle = '#5a67d8';
        } else if (drone.state === 'LOADING' || drone.state === 'DELIVERING') {
            ctx.fillStyle = '#9f7aea';
        } else {
            ctx.fillStyle = '#a0aec0';
        }
        
        // Desenhar drone como triângulo
        ctx.save();
        
        // Adicionar rotação para diferenciar drones
        ctx.translate(x, y);
        if (drone.state === 'FLYING' || drone.state === 'RETURNING') {
            const angle = Math.atan2(drone.destination.y - drone.position.y, 
                                    drone.destination.x - drone.position.x);
            ctx.rotate(angle + Math.PI/2);
        }
        
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-7, 7);
        ctx.lineTo(7, 7);
        ctx.closePath();
        ctx.fill();
        
        // Contorno do drone
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
        
        // Número do drone
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(drone.id.toString(), x - 3, y + 3);
        
        // Indicador de carga se carregando pacotes
        if (drone.currentLoad && drone.currentLoad.length > 0) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x + 10, y - 10, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '8px Arial';
            ctx.fillText(drone.currentLoad.length.toString(), x + 8, y - 7);
        }
        
        // Linha até destino
        if (drone.destination && (drone.state === 'FLYING' || drone.state === 'RETURNING')) {
            ctx.strokeStyle = 'rgba(90, 103, 216, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(drone.destination.x * 12, drone.destination.y * 12);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Mostrar bateria baixa
        if (drone.battery < 30) {
            ctx.fillStyle = drone.battery < 15 ? '#e53e3e' : '#ed8936';
            ctx.fillRect(x - 15, y - 20, 30, 4);
            ctx.fillStyle = '#48bb78';
            ctx.fillRect(x - 15, y - 20, (drone.battery / 100) * 30, 4);
        }
    });
}

// Atualizar display
function updateDisplay() {
    // Atualizar tempo
    const hours = Math.floor(simulationTime / 3600000);
    const minutes = Math.floor((simulationTime % 3600000) / 60000);
    const seconds = Math.floor((simulationTime % 60000) / 1000);
    document.getElementById('simulation-time').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Atualizar status dos drones
    updateDroneStatus();
    
    // Atualizar fila de entregas
    updateDeliveryQueue();
    
    // Atualizar estatísticas
    updateStatistics();
}

// Atualizar status dos drones
function updateDroneStatus() {
    const dronesList = document.getElementById('drones-list');
    dronesList.innerHTML = '';
    
    drones.forEach(drone => {
        const info = drone.getInfo();
        const droneCard = document.createElement('div');
        droneCard.className = 'drone-card' + (info.state === 'FLYING' ? ' drone-flying' : '');
        
        const batteryClass = info.battery < 20 ? 'battery-critical' : 
                            info.battery < 50 ? 'battery-low' : '';
        
        droneCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4>🚁 Drone ${info.id}</h4>
                <span class="drone-status">${info.state}</span>
            </div>
            <div class="drone-info">
                <div>
                    <small>Bateria:</small>
                    <div class="drone-battery">
                        <div class="battery-level ${batteryClass}" style="width: ${info.battery}%"></div>
                    </div>
                </div>
                <div>
                    <small>Carga:</small>
                    <strong>${info.currentWeight.toFixed(1)}/${info.capacity} kg</strong>
                </div>
                <div>
                    <small>Entregas:</small>
                    <strong>${info.deliveriesCompleted}</strong>
                </div>
                <div>
                    <small>Eficiência:</small>
                    <strong>${info.efficiency.toFixed(0)}%</strong>
                </div>
            </div>
        `;
        
        dronesList.appendChild(droneCard);
    });
}

// Atualizar fila de entregas
function updateDeliveryQueue() {
    const queueList = document.getElementById('delivery-queue-list');
    queueList.innerHTML = '';
    
    const pendingDeliveries = deliveries.filter(d => 
        d.status === 'PENDENTE' || d.status === 'EM_ROTA' || d.status === 'COLETADO'
    ).sort((a, b) => {
        const priorityOrder = { alta: 0, media: 1, baixa: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    pendingDeliveries.forEach(delivery => {
        const deliveryItem = document.createElement('div');
        deliveryItem.className = `delivery-item priority-${delivery.priority}`;
        
        const waitTime = Math.floor((Date.now() - delivery.createdAt) / 1000);
        
        deliveryItem.innerHTML = `
            <div class="delivery-info">
                <div>
                    <strong>#${delivery.id}</strong>
                    <span style="margin-left: 10px;">📍 (${delivery.location.x.toFixed(1)}, ${delivery.location.y.toFixed(1)})</span>
                    <span style="margin-left: 10px;">⚖️ ${delivery.weight.toFixed(1)}kg</span>
                </div>
                <div>
                    <small>${
                        delivery.status === 'EM_ROTA' ? '🚁 Drone a caminho' :
                        delivery.status === 'COLETADO' ? '📦 Coletado - retornando' :
                        '⏳ Aguardando ' + waitTime + 's'
                    }</small>
                </div>
            </div>
        `;
        
        queueList.appendChild(deliveryItem);
    });
    
    if (pendingDeliveries.length === 0) {
        queueList.innerHTML = '<div style="text-align: center; color: #718096;">Nenhuma entrega pendente</div>';
    }
}

// Atualizar estatísticas
function updateStatistics() {
    // Contar entregas
    stats.deliveriesCompleted = deliveries.filter(d => d.status === 'ENTREGUE').length;
    stats.deliveriesPending = deliveries.filter(d => d.status === 'PENDENTE' || d.status === 'EM_ROTA').length;
    
    // Calcular distância total e viagens
    stats.totalDistance = 0;
    stats.totalTrips = 0;
    let totalEfficiency = 0;
    let bestDroneObj = null;
    
    drones.forEach(drone => {
        stats.totalDistance += drone.distanceTraveled;
        stats.totalTrips += drone.trips;
        totalEfficiency += drone.efficiency;
        
        if (!bestDroneObj || drone.deliveriesCompleted > bestDroneObj.deliveriesCompleted) {
            bestDroneObj = drone;
        }
    });
    
    // Calcular tempo médio
    const completedDeliveries = deliveries.filter(d => d.status === 'ENTREGUE');
    if (completedDeliveries.length > 0) {
        const totalTime = completedDeliveries.reduce((sum, d) => {
            return sum + (d.deliveryTime - d.createdAt);
        }, 0);
        stats.avgDeliveryTime = totalTime / completedDeliveries.length;
    }
    
    // Eficiência de combustível
    if (drones.length > 0) {
        stats.fuelEfficiency = totalEfficiency / drones.length;
    }
    
    // Melhor drone
    if (bestDroneObj) {
        stats.bestDrone = `Drone ${bestDroneObj.id}`;
    }
    
    // Atualizar DOM
    document.getElementById('deliveries-completed').textContent = stats.deliveriesCompleted;
    document.getElementById('deliveries-pending').textContent = stats.deliveriesPending;
    document.getElementById('avg-delivery-time').textContent = formatTime(stats.avgDeliveryTime);
    document.getElementById('total-distance').textContent = stats.totalDistance.toFixed(1) + ' km';
    document.getElementById('fuel-efficiency').textContent = stats.fuelEfficiency.toFixed(0) + '%';
    document.getElementById('best-drone').textContent = stats.bestDrone;
    document.getElementById('total-trips').textContent = stats.totalTrips;
    document.getElementById('route-optimization').textContent = stats.routeOptimization.toFixed(0) + '%';
}

// Formatar tempo
function formatTime(ms) {
    if (!ms || ms === 0) return '00:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Adicionar log de evento
function addEventLog(message, type = 'info') {
    const logList = document.getElementById('event-log-list');
    const eventItem = document.createElement('div');
    eventItem.className = 'event-item';
    
    const time = new Date().toLocaleTimeString();
    
    eventItem.innerHTML = `
        <span class="event-time">${time}</span>
        <span class="event-message event-type-${type}">${message}</span>
    `;
    
    logList.insertBefore(eventItem, logList.firstChild);
    
    // Limitar a 50 eventos
    while (logList.children.length > 50) {
        logList.removeChild(logList.lastChild);
    }
}

// Adicionar feedback do cliente
function addCustomerFeedback(feedback) {
    const feedbackList = document.getElementById('customer-feedback-list');
    const feedbackItem = document.createElement('div');
    feedbackItem.className = 'feedback-item';
    
    const stars = '⭐'.repeat(feedback.rating);
    
    feedbackItem.innerHTML = `
        <div class="feedback-header">
            <span class="feedback-customer">${feedback.customer}</span>
            <span class="feedback-rating">${stars}</span>
        </div>
        <div class="feedback-message">"${feedback.message}"</div>
    `;
    
    feedbackList.insertBefore(feedbackItem, feedbackList.firstChild);
    
    // Limitar a 20 feedbacks
    while (feedbackList.children.length > 20) {
        feedbackList.removeChild(feedbackList.lastChild);
    }
}

// Expor função globalmente
window.addEventLog = addEventLog;
window.addCustomerFeedback = addCustomerFeedback;