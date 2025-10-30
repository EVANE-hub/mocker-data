.PHONY: help build up down restart logs shell clean health

help: ## Afficher l'aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Construire l'image Docker
	docker-compose build

up: ## Démarrer le conteneur
	docker-compose up -d

down: ## Arrêter le conteneur
	docker-compose down

restart: ## Redémarrer le conteneur
	docker-compose restart

logs: ## Voir les logs
	docker-compose logs -f

shell: ## Accéder au shell du conteneur
	docker-compose exec zerve-mock-api sh

clean: ## Nettoyer les conteneurs et images
	docker-compose down -v
	docker system prune -f

health: ## Vérifier le health check
	@curl -s http://localhost:3002/health | jq

rebuild: ## Reconstruire et redémarrer
	docker-compose up -d --build

ps: ## Voir l'état des conteneurs
	docker-compose ps
