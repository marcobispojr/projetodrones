// Classe Drone com sistema de estados e bateria
class Drone {
    constructor(id, capacity = 10, range = 20, battery = 100) {
        this.id = id;
        this.capacity = capacity; // kg
        this.maxRange = range; // km
        this.battery = battery; // %
        this.maxBattery = 100;
        this.state = 'IDLE'; // IDLE, LOADING, FLYING, DELIVERING, RETURNING, RECHARGING
        this.position = { x: 25, y: 25 }; // Base no centro
        this.basePosition = { x: 25, y: 25 };
        this.currentLoad = [];
        this.currentWeight = 0;
        this.destination = null;
        this.distanceTraveled = 0;
        this.deliveriesCompleted = 0;
        this.totalDeliveryTime = 0;
        this.trips = 0;
        this.efficiency = 100;
        this.speed = 50; // km/h
        this.batteryConsumptionRate = 2; // % por km
        this.isRecharging = false;
        this.rechargeRate = 20; // % por segundo de simulação
    }

    // Calcular distância entre dois pontos
    calculateDistance(from, to) {
        return Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    }

    // Verificar se pode aceitar uma entrega
    canAcceptDelivery(delivery) {
        // Só aceita se estiver IDLE
        if (this.state !== 'IDLE') return false;
        
        // Verificar peso
        if (this.currentWeight + delivery.weight > this.capacity) return false;
        
        const distance = this.calculateDistance(this.basePosition, delivery.location) * 2; // ida e volta
        
        // Verificar alcance
        if (distance > this.maxRange) return false;
        
        // Verificar bateria (margem de segurança de 15%)
        const batteryNeeded = distance * this.batteryConsumptionRate;
        if (this.battery < batteryNeeded + 15) return false;
        
        return true;
    }

    // Carregar pacotes no drone
    loadPackages(deliveries) {
        if (this.state !== 'IDLE') return false;
        
        this.state = 'LOADING';
        this.currentLoad = deliveries;
        this.currentWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
        this.loadingStartTime = Date.now();
        this.loadingDuration = 500; // 0.5 segundo para carregar
        
        return true;
    }

    // Mover drone para destino
    moveTowards(target, deltaTime) {
        if (this.state !== 'FLYING' && this.state !== 'RETURNING') return;
        
        const distance = this.calculateDistance(this.position, target);
        if (distance < 0.5) {
            this.position = { ...target };
            return true; // Chegou ao destino
        }
        
        // Calcular movimento
        const moveDistance = (this.speed / 3600) * deltaTime; // converter para km/s
        const ratio = Math.min(moveDistance / distance, 1);
        
        this.position.x += (target.x - this.position.x) * ratio;
        this.position.y += (target.y - this.position.y) * ratio;
        
        // Consumir bateria
        const distanceMoved = moveDistance;
        this.battery = Math.max(0, this.battery - (distanceMoved * this.batteryConsumptionRate));
        this.distanceTraveled += distanceMoved;
        
        // Verificar bateria crítica
        if (this.battery < 15) {
            this.emergencyReturn();
        }
        
        return false;
    }

    // Coletar pacote
    collectPackage() {
        if (this.state !== 'FLYING' || this.currentLoad.length === 0) return;
        
        this.state = 'COLLECTING';
        this.collectingStartTime = Date.now();
        this.collectingDuration = 1000; // 1 segundo para coletar
    }
    
    // Entregar pacote na base
    deliverPackage() {
        if (this.state !== 'RETURNING' || this.currentLoad.length === 0) return;
        if (this.calculateDistance(this.position, this.basePosition) > 1) return;
        
        this.state = 'DELIVERING';
        this.deliveringStartTime = Date.now();
        this.deliveringDuration = 1000; // 1 segundo para entregar
    }

    // Gerar feedback do cliente
    generateCustomerFeedback(delivery) {
        const feedbackMessages = [
            "Entrega super rápida! Excelente serviço!",
            "Drone chegou no horário previsto. Muito bom!",
            "Pacote em perfeitas condições. Obrigado!",
            "Serviço inovador e eficiente!",
            "Adorei a experiência de receber por drone!",
            "Entrega precisa e segura. Recomendo!",
            `Seu pacote está a ${Math.floor(this.calculateDistance(this.position, delivery.location))} km de distância!`,
            "Acompanhei o drone em tempo real. Fantástico!",
            "Tecnologia impressionante! Futuro das entregas!",
            "Rápido e sem contato. Perfeito!"
        ];
        
        const rating = delivery.priority === 'alta' ? 5 : Math.floor(Math.random() * 2) + 4;
        const feedback = {
            customer: `Cliente #${delivery.id}`,
            rating: rating,
            message: feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)],
            time: new Date()
        };
        
        if (window.addCustomerFeedback) {
            window.addCustomerFeedback(feedback);
        }
    }

    // Retorno de emergência (bateria baixa)
    emergencyReturn() {
        if (this.state === 'RECHARGING' || this.state === 'IDLE') return;
        
        this.state = 'RETURNING';
        this.destination = this.basePosition;
        
        // Descartar entregas não realizadas
        if (this.currentLoad.length > 0) {
            this.currentLoad.forEach(delivery => {
                delivery.status = 'REAGENDADO';
            });
            this.currentLoad = [];
            this.currentWeight = 0;
        }
        
        if (window.addEventLog) {
            window.addEventLog(`⚠️ Drone ${this.id} retornando - bateria baixa (${this.battery.toFixed(0)}%)`, 'warning');
        }
    }

    // Recarregar bateria
    recharge(deltaTime) {
        if (this.battery >= this.maxBattery) {
            this.isRecharging = false;
            this.state = 'IDLE';
            return true;
        }
        
        this.state = 'RECHARGING';
        this.isRecharging = true;
        this.battery = Math.min(this.maxBattery, this.battery + (this.rechargeRate * deltaTime / 1000));
        
        return false;
    }

    // Atualizar estado do drone
    update(deltaTime) {
        switch (this.state) {
            case 'LOADING':
                // Verificar se terminou de carregar
                if (Date.now() - this.loadingStartTime >= this.loadingDuration) {
                    this.state = 'FLYING';
                    this.trips++;
                    
                    if (window.addEventLog) {
                        window.addEventLog(`🛫 Drone ${this.id} decolou!`, 'success');
                    }
                }
                break;
                
            case 'FLYING':
                if (this.destination) {
                    const arrived = this.moveTowards(this.destination, deltaTime);
                    if (arrived) {
                        // Chegou no local de coleta
                        this.collectPackage();
                    }
                }
                break;
                
            case 'RETURNING':
                const atBase = this.moveTowards(this.basePosition, deltaTime);
                if (atBase) {
                    // Chegou na base
                    if (this.currentLoad.length > 0 && this.currentLoad[0].status === 'COLETADO') {
                        // Tem pacotes coletados para entregar
                        this.deliverPackage();
                    } else if (this.battery < 30) {
                        this.state = 'RECHARGING';
                    } else {
                        this.state = 'IDLE';
                    }
                }
                break;
                
            case 'RECHARGING':
                const charged = this.recharge(deltaTime);
                if (charged) {
                    if (window.addEventLog) {
                        window.addEventLog(`🔋 Drone ${this.id} totalmente carregado`, 'success');
                    }
                }
                break;
                
            case 'COLLECTING':
                // Verificar se terminou de coletar
                if (Date.now() - this.collectingStartTime >= this.collectingDuration) {
                    // Marcar pacote como coletado
                    if (this.currentLoad.length > 0) {
                        const delivery = this.currentLoad[0];
                        delivery.status = 'COLETADO';
                        
                        if (window.addEventLog) {
                            window.addEventLog(`📦 Drone ${this.id} coletou pedido #${delivery.id}`, 'info');
                        }
                    }
                    
                    // Agora voltar para base para entregar
                    this.state = 'RETURNING';
                    this.destination = this.basePosition;
                }
                break;
                
            case 'DELIVERING':
                // Verificar se terminou de entregar
                if (Date.now() - this.deliveringStartTime >= this.deliveringDuration) {
                    while (this.currentLoad.length > 0 && this.currentLoad[0].status === 'COLETADO') {
                        const delivery = this.currentLoad.shift();
                        this.deliveriesCompleted++;
                        delivery.status = 'ENTREGUE';
                        delivery.deliveredBy = this.id;
                        delivery.deliveryTime = new Date();
                        
                        // Gerar feedback do cliente
                        this.generateCustomerFeedback(delivery);
                    }
                    
                    this.currentWeight = 0;
                    
                    if (this.currentLoad.length > 0) {
                        // Ainda tem entregas para coletar
                        this.state = 'FLYING';
                        this.destination = this.currentLoad[0].location;
                    } else {
                        // Todas as entregas concluídas
                        if (this.battery < 30) {
                            this.state = 'RECHARGING';
                            if (window.addEventLog) {
                                window.addEventLog(`🔋 Drone ${this.id} recarregando bateria`, 'warning');
                            }
                        } else {
                            this.state = 'IDLE';
                            if (window.addEventLog) {
                                window.addEventLog(`✅ Drone ${this.id} disponível para nova entrega`, 'success');
                            }
                        }
                    }
                }
                break;
        }
        
        // Calcular eficiência
        if (this.deliveriesCompleted > 0) {
            this.efficiency = (this.deliveriesCompleted / Math.max(this.trips, 1)) * 100;
        }
    }

    // Obter informações do drone
    getInfo() {
        return {
            id: this.id,
            state: this.state,
            battery: this.battery,
            position: this.position,
            currentWeight: this.currentWeight,
            capacity: this.capacity,
            deliveriesCompleted: this.deliveriesCompleted,
            efficiency: this.efficiency,
            distanceTraveled: this.distanceTraveled,
            trips: this.trips,
            isRecharging: this.isRecharging,
            currentLoadCount: this.currentLoad.length
        };
    }

}

