// Algoritmos de otimização para alocação de entregas
class DeliveryOptimizer {
    constructor() {
        this.priorityWeights = {
            alta: 3,
            media: 2,
            baixa: 1
        };
    }

    // Algoritmo principal de otimização
    optimizeDeliveryAllocation(drones, deliveries) {
        if (!deliveries || deliveries.length === 0) return [];
        
        // Ordenar entregas por prioridade e proximidade
        const sortedDeliveries = this.sortDeliveriesByPriority(deliveries);
        
        // Agrupar entregas por proximidade e capacidade
        const deliveryGroups = this.groupDeliveriesByProximity(sortedDeliveries, drones[0].capacity);
        
        // Alocar grupos aos drones disponíveis
        const allocations = this.allocateDeliveriesToDrones(drones, deliveryGroups);
        
        return allocations;
    }

    // Ordenar entregas por prioridade e tempo de espera
    sortDeliveriesByPriority(deliveries) {
        return deliveries.sort((a, b) => {
            // Primeiro, ordenar por prioridade
            const priorityDiff = this.priorityWeights[b.priority] - this.priorityWeights[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Depois, por tempo de espera (FIFO)
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    // Agrupar entregas próximas para otimizar rotas
    groupDeliveriesByProximity(deliveries, maxCapacity) {
        const groups = [];
        const used = new Set();
        
        for (let i = 0; i < deliveries.length; i++) {
            if (used.has(i)) continue;
            
            const group = [deliveries[i]];
            let totalWeight = deliveries[i].weight;
            used.add(i);
            
            // Tentar adicionar entregas próximas ao grupo
            for (let j = i + 1; j < deliveries.length; j++) {
                if (used.has(j)) continue;
                
                const distance = this.calculateDistance(
                    deliveries[i].location,
                    deliveries[j].location
                );
                
                // Se está próximo (< 5km) e cabe no drone
                if (distance < 5 && totalWeight + deliveries[j].weight <= maxCapacity) {
                    group.push(deliveries[j]);
                    totalWeight += deliveries[j].weight;
                    used.add(j);
                    
                    // Máximo de 3 entregas por grupo para evitar rotas muito longas
                    if (group.length >= 3) break;
                }
            }
            
            groups.push(group);
        }
        
        return groups;
    }

    // Alocar grupos de entregas aos drones
    allocateDeliveriesToDrones(drones, deliveryGroups) {
        const allocations = [];
        
        for (const group of deliveryGroups) {
            // Encontrar o melhor drone para este grupo
            const bestDrone = this.findBestDroneForDelivery(drones, group);
            
            if (bestDrone) {
                allocations.push({
                    drone: bestDrone,
                    deliveries: group,
                    estimatedTime: this.estimateDeliveryTime(bestDrone, group),
                    totalDistance: this.calculateTotalDistance(bestDrone.basePosition, group),
                    efficiency: this.calculateEfficiency(bestDrone, group)
                });
            }
        }
        
        return allocations;
    }

    // Encontrar o melhor drone para uma entrega
    findBestDroneForDelivery(drones, deliveryGroup) {
        let bestDrone = null;
        let bestScore = -Infinity;
        
        const totalWeight = deliveryGroup.reduce((sum, d) => sum + d.weight, 0);
        
        for (const drone of drones) {
            // Verificar se o drone pode fazer esta entrega
            if (drone.state !== 'IDLE' || drone.battery < 30) continue;
            if (totalWeight > drone.capacity) continue;
            
            const totalDistance = this.calculateTotalDistance(drone.basePosition, deliveryGroup);
            const batteryNeeded = totalDistance * drone.batteryConsumptionRate;
            
            if (batteryNeeded > drone.battery - 10) continue; // Margem de segurança
            
            // Calcular score baseado em múltiplos fatores
            const score = this.calculateDroneScore(drone, deliveryGroup, totalDistance);
            
            if (score > bestScore) {
                bestScore = score;
                bestDrone = drone;
            }
        }
        
        return bestDrone;
    }

    // Calcular pontuação do drone para uma entrega
    calculateDroneScore(drone, deliveryGroup, totalDistance) {
        let score = 0;
        
        // Fator 1: Bateria disponível (quanto mais, melhor)
        score += drone.battery * 0.5;
        
        // Fator 2: Eficiência do drone (histórico)
        score += drone.efficiency * 0.3;
        
        // Fator 3: Distância (quanto menor, melhor)
        score -= totalDistance * 2;
        
        // Fator 4: Número de entregas no grupo (quanto mais, melhor)
        score += deliveryGroup.length * 10;
        
        // Fator 5: Prioridade das entregas
        const priorityScore = deliveryGroup.reduce((sum, d) => 
            sum + this.priorityWeights[d.priority], 0
        );
        score += priorityScore * 5;
        
        // Fator 6: Capacidade utilizada (otimizar uso)
        const totalWeight = deliveryGroup.reduce((sum, d) => sum + d.weight, 0);
        const capacityUtilization = (totalWeight / drone.capacity) * 100;
        score += capacityUtilization * 0.2;
        
        return score;
    }

    // Calcular distância total de uma rota
    calculateTotalDistance(start, deliveries) {
        if (deliveries.length === 0) return 0;
        
        let totalDistance = 0;
        let currentPos = start;
        
        // Ordenar entregas para rota otimizada (nearest neighbor)
        const sortedDeliveries = this.sortDeliveriesByRoute(currentPos, [...deliveries]);
        
        for (const delivery of sortedDeliveries) {
            totalDistance += this.calculateDistance(currentPos, delivery.location);
            currentPos = delivery.location;
        }
        
        // Adicionar distância de volta à base
        totalDistance += this.calculateDistance(currentPos, start);
        
        return totalDistance;
    }

    // Ordenar entregas para criar rota otimizada (Nearest Neighbor)
    sortDeliveriesByRoute(start, deliveries) {
        const sorted = [];
        let currentPos = start;
        
        while (deliveries.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = Infinity;
            
            for (let i = 0; i < deliveries.length; i++) {
                const distance = this.calculateDistance(currentPos, deliveries[i].location);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
            
            const nearest = deliveries.splice(nearestIndex, 1)[0];
            sorted.push(nearest);
            currentPos = nearest.location;
        }
        
        return sorted;
    }

    // Calcular tempo estimado de entrega
    estimateDeliveryTime(drone, deliveries) {
        const totalDistance = this.calculateTotalDistance(drone.basePosition, deliveries);
        const flyingTime = (totalDistance / drone.speed) * 60; // minutos
        const deliveryTime = deliveries.length * 1; // 1 minuto por entrega
        const loadingTime = 2; // 2 minutos para carregar
        
        return flyingTime + deliveryTime + loadingTime;
    }

    // Calcular eficiência da alocação
    calculateEfficiency(drone, deliveries) {
        const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
        const capacityUtilization = (totalWeight / drone.capacity) * 100;
        
        const totalDistance = this.calculateTotalDistance(drone.basePosition, deliveries);
        const distanceEfficiency = Math.max(0, 100 - (totalDistance * 2)); // Penalidade por distância
        
        return (capacityUtilization + distanceEfficiency) / 2;
    }

    // Calcular distância euclidiana
    calculateDistance(from, to) {
        return Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    }

    // Algoritmo de bin packing para otimizar capacidade
    binPackingOptimization(deliveries, capacity) {
        const bins = [];
        const sortedDeliveries = deliveries.sort((a, b) => b.weight - a.weight);
        
        for (const delivery of sortedDeliveries) {
            let placed = false;
            
            // Tentar colocar em um bin existente
            for (const bin of bins) {
                const currentWeight = bin.reduce((sum, d) => sum + d.weight, 0);
                if (currentWeight + delivery.weight <= capacity) {
                    bin.push(delivery);
                    placed = true;
                    break;
                }
            }
            
            // Se não couber em nenhum, criar novo bin
            if (!placed) {
                bins.push([delivery]);
            }
        }
        
        return bins;
    }

    // Otimização por algoritmo genético (para rotas complexas)
    geneticAlgorithmOptimization(deliveries, populationSize = 50, generations = 100) {
        // Criar população inicial
        let population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(this.shuffleArray([...deliveries]));
        }
        
        // Evoluir por várias gerações
        for (let gen = 0; gen < generations; gen++) {
            // Avaliar fitness
            const evaluated = population.map(individual => ({
                route: individual,
                fitness: this.calculateRouteFitness(individual)
            }));
            
            // Selecionar melhores
            evaluated.sort((a, b) => b.fitness - a.fitness);
            const elite = evaluated.slice(0, populationSize / 2);
            
            // Criar nova geração
            population = elite.map(e => e.route);
            
            // Adicionar mutações e crossovers
            while (population.length < populationSize) {
                if (Math.random() < 0.7) {
                    // Crossover
                    const parent1 = elite[Math.floor(Math.random() * elite.length)].route;
                    const parent2 = elite[Math.floor(Math.random() * elite.length)].route;
                    population.push(this.crossover(parent1, parent2));
                } else {
                    // Mutação
                    const parent = elite[Math.floor(Math.random() * elite.length)].route;
                    population.push(this.mutate([...parent]));
                }
            }
        }
        
        // Retornar melhor solução
        const best = population.map(individual => ({
            route: individual,
            fitness: this.calculateRouteFitness(individual)
        })).sort((a, b) => b.fitness - a.fitness)[0];
        
        return best.route;
    }

    // Calcular fitness de uma rota
    calculateRouteFitness(route) {
        const basePos = { x: 25, y: 25 };
        const totalDistance = this.calculateTotalDistance(basePos, route);
        
        // Penalizar distância e recompensar prioridade
        let priorityBonus = 0;
        for (let i = 0; i < route.length; i++) {
            priorityBonus += this.priorityWeights[route[i].priority] * (route.length - i);
        }
        
        return 1000 - totalDistance + priorityBonus;
    }

    // Crossover para algoritmo genético
    crossover(parent1, parent2) {
        const child = [];
        const used = new Set();
        
        // Pegar primeira metade do parent1
        const half = Math.floor(parent1.length / 2);
        for (let i = 0; i < half; i++) {
            child.push(parent1[i]);
            used.add(parent1[i].id);
        }
        
        // Completar com parent2
        for (const delivery of parent2) {
            if (!used.has(delivery.id)) {
                child.push(delivery);
            }
        }
        
        return child;
    }

    // Mutação para algoritmo genético
    mutate(route) {
        if (route.length < 2) return route;
        
        // Trocar duas posições aleatórias
        const i = Math.floor(Math.random() * route.length);
        const j = Math.floor(Math.random() * route.length);
        
        [route[i], route[j]] = [route[j], route[i]];
        
        return route;
    }

    // Embaralhar array (para população inicial)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Calcular estatísticas de otimização
    calculateOptimizationStats(allocations) {
        const stats = {
            totalTrips: allocations.length,
            totalDistance: 0,
            avgDistance: 0,
            totalTime: 0,
            avgTime: 0,
            avgEfficiency: 0,
            deliveriesPerTrip: 0
        };
        
        for (const allocation of allocations) {
            stats.totalDistance += allocation.totalDistance;
            stats.totalTime += allocation.estimatedTime;
            stats.avgEfficiency += allocation.efficiency;
            stats.deliveriesPerTrip += allocation.deliveries.length;
        }
        
        if (allocations.length > 0) {
            stats.avgDistance = stats.totalDistance / allocations.length;
            stats.avgTime = stats.totalTime / allocations.length;
            stats.avgEfficiency = stats.avgEfficiency / allocations.length;
            stats.deliveriesPerTrip = stats.deliveriesPerTrip / allocations.length;
        }
        
        return stats;
    }
}