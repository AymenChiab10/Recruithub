# RecruitHub

Plateforme de recrutement en microservices : gestion REST des candidats, offres et candidatures, vérification des diplômes par SOAP et calcul/classement par gRPC.

## Architecture

| Module | Interface | Port |
|---|---|---:|
| `api-gateway` | HTTP, routage `/api/v1/**` | 8080 |
| `recruitment-service` | REST, orchestration SOAP/gRPC | 8081 |
| `matching-service` | HTTP actuator + gRPC | 8082 / 9090 |
| `diploma-registry-service` | SOAP, WSDL sur `/ws/diploma.wsdl` | 8083 |

Les contrats sont dans [`contracts/`](contracts/). La passerelle transmet les requêtes vers le service de recrutement. Celui-ci enregistre la candidature avant les appels distants et conserve un statut en attente lorsque le registre ou le service de matching est indisponible. Un traitement planifié reprend les candidatures en attente.

## Prérequis

- Java 21
- Maven 3.9+
- Docker avec Docker Compose (pour le démarrage complet)

## Construire et tester

À la racine :

```powershell
mvn test
```

Le service de recrutement utilise H2 par défaut pour le développement local. Les services de matching et du registre utilisent également H2 par défaut. Les variables `DB_URL`, `DB_USERNAME` et `DB_PASSWORD` permettent de configurer PostgreSQL.

## Démarrer l’ensemble

```powershell
docker compose up --build
```

La pile contient les quatre services applicatifs et trois bases PostgreSQL. L’API est accessible sur `http://localhost:8080`; l’endpoint de santé de la passerelle est `http://localhost:8080/actuator/health`. L’interface Swagger est disponible sur `http://localhost:8081/swagger-ui/index.html`.

Le registre simulé contient un diplôme de démonstration :

```json
{
  "firstName": "Demo",
  "lastName": "Candidate",
  "email": "demo@example.test",
  "diplomaTitle": "Computer Science",
  "diplomaInstitution": "IIT",
  "diplomaYear": 2024
}
```

## Lancer un module localement

Lancer d’abord les services dont il dépend, puis :

```powershell
mvn -pl api-gateway spring-boot:run
mvn -pl recruitment-service spring-boot:run
mvn -pl matching-service spring-boot:run
mvn -pl diploma-registry-service spring-boot:run
```

Pour l’intégration locale, configurer `DIPLOMA_SERVICE_URL`, `MATCHING_HOST` et `MATCHING_GRPC_PORT` sur le service de recrutement.
