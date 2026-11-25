# Guide complet de RecruitHub

## 1. Présentation

RecruitHub est une application de recrutement construite comme un ensemble de
microservices Java. Elle permet de gérer les candidats, les offres d'emploi et
les candidatures. Lorsqu'une candidature est envoyée, le service de recrutement
orchestre deux vérifications distantes :

1. le registre vérifie le diplôme par SOAP;
2. le service Matching calcule un score et classe les candidatures par gRPC.

Le client, par exemple Postman, communique avec la passerelle en HTTP/JSON. Les
services se parlent ensuite sur le réseau interne Docker avec leurs propres
protocoles.

## 2. Technologies et structure du dépôt

- Java 21
- Maven multi-module
- Spring Boot 3.5.6 et Spring Cloud 2025
- Spring Data JPA pour la persistance
- PostgreSQL 17 sous Docker Compose
- H2 comme base de données par défaut pour le développement local
- Spring Cloud Gateway pour le routage
- SOAP/WSDL/XSD pour la vérification des diplômes
- gRPC/Protocol Buffers pour le calcul et le classement

Le POM racine déclare les quatre modules :

| Dossier | Responsabilité principale |
|---|---|
| `api-gateway/` | Point d'entrée HTTP et routage vers Recrutement |
| `recruitment-service/` | API REST, données de recrutement et orchestration |
| `matching-service/` | Serveur gRPC, calcul et stockage des scores |
| `diploma-registry-service/` | Endpoint SOAP et registre des diplômes |
| `contracts/` | Contrats OpenAPI et gRPC partagés |

Les principales ressources de contrats sont `contracts/openapi.yaml`,
`contracts/matching.proto`, ainsi que le WSDL et le XSD SOAP dans
`diploma-registry-service/src/main/resources/`.

## 3. Services, ports et bases de données

| Service | Fonction | Port hôte | Port interne Docker |
|---|---|---:|---:|
| API Gateway | HTTP, route `/api/v1/**` | 8085 | 8080 |
| Recruitment Service | API REST et orchestration | 8084 | 8081 |
| Matching Service | Actuator HTTP et gRPC | 8082 et 9090 | 8082 et 9090 |
| Diploma Registry | SOAP et Actuator HTTP | 8083 | 8083 |

Les ports hôte 8085 et 8084 sont utilisés parce que les ports 8080 et 8081
étaient déjà occupés sur la machine. Les services continuent d'écouter sur leurs
ports internes habituels.

Chaque service possède sa propre base PostgreSQL :

- `recruitment-db` stocke les candidats, les offres et les candidatures;
- `matching-db` stocke les scores;
- `diploma-db` stocke les diplômes enregistrés.

Les bases ne sont pas partagées entre les services. Un service obtient les
informations d'un autre par son API, jamais en lisant directement sa base.
Dans Compose, les conteneurs se trouvent sur le même réseau et se joignent par
leur nom de service, par exemple `matching-service:9090`.

## 4. Communication entre les services

```text
Client/Postman
    | HTTP + JSON
    v
API Gateway (:8085 sur l'hôte, :8080 dans Docker)
    | HTTP + JSON
    v
Recruitment Service (:8081 dans Docker)
    | SOAP + XML                 | gRPC + Protocol Buffers
    v                            v
Diploma Registry (:8083)     Matching Service (:9090)
```

### 4.1 Entrée REST et passerelle

La passerelle route toutes les requêtes `/api/v1/**` vers Recruitment Service.
Dans Docker, la destination est `http://recruitment-service:8081`. La
configuration CORS permet par défaut l'origine de développement
`http://localhost:3000`.

La passerelle n'implémente pas les règles métier. Son filtre d'observabilité
journalise la méthode, le chemin, le statut et la durée. Si le service amont
n'est pas joignable, il peut renvoyer `502 Bad Gateway`.

### 4.2 Parcours d'une candidature

Pour `POST /api/v1/candidatures` :

1. `RecruitmentController` reçoit les identifiants du candidat et de l'offre.
2. `RecruitmentService` vérifie que les deux existent et que le candidat n'a
   pas déjà postulé à cette offre.
3. La candidature est enregistrée dans `recruitment-db`.
4. `ApplicationProcessingService` demande la vérification du diplôme au registre
   SOAP, si le candidat possède les renseignements du diplôme.
5. Il demande ensuite un score à Matching par gRPC.
6. La candidature est mise à jour et une réponse JSON est retournée au client.

Le parcours correspondant dans le code commence dans
`RecruitmentController.createApplication`, continue dans
`RecruitmentService.createApplication`, puis dans
`ApplicationProcessingService.process`.

### 4.3 Vérification de diplôme par SOAP

Recruitment construit une demande contenant le nom complet du candidat, le
titre du diplôme, l'établissement et l'année. `SoapDiplomaClient` utilise
`WebServiceTemplate` pour sérialiser la demande en SOAP/XML et l'envoyer à
`http://diploma-registry-service:8083/ws`.

Le registre reçoit `VerifyDiplomaRequest` sur son endpoint SOAP. Il cherche une
correspondance dans `diploma-db` et renvoie `valid=true` avec le statut
`VERIFIED`, ou une faute SOAP si le diplôme n'existe pas. Le WSDL est exposé sur
`http://localhost:8083/ws/diploma.wsdl` et référence le schéma publié sur
`http://localhost:8083/ws/diplomaXsd.xsd`.

Lorsque la base du registre est vide, une donnée de démonstration est ajoutée :

| Nom complet | Diplôme | Établissement | Année |
|---|---|---|---:|
| Demo Candidate | Computer Science | IIT | 2024 |

Le nom complet doit correspondre au prénom et au nom réunis. Par exemple,
`firstName: "Demo"` et `lastName: "Candidate"` correspondent à cette donnée.

### 4.4 Calcul et classement par gRPC

`MatchingGrpcClient` construit un `ScoreRequest` contenant les identifiants de
candidature, candidat et offre, les compétences et l'expérience. Il utilise un
stub gRPC généré à partir de `contracts/matching.proto`.

Le serveur gRPC est démarré par `GrpcServerRunner` sur le port 9090. Il délègue
`CalculateScore` à `MatchingGrpcService`, qui appelle `ScoreCalculator` et
enregistre le résultat dans `matching-db`. Le score est renvoyé à Recruitment,
qui le conserve dans sa propre candidature.

Le calcul donne :

- jusqu'à 70 points pour la proportion de compétences requises qui correspondent;
- jusqu'à 30 points pour l'expérience, plafonnée à l'expérience requise;
- les comparaisons de compétences ignorent la casse et les espaces autour des
  mots;
- le résultat est arrondi à deux décimales.

L'endpoint de classement de Recruitment appelle `RankApplications` par gRPC.
Matching envoie les scores persistés par ordre décroissant. Recruitment ne
retourne que ceux dont la candidature locale a `scoringCompleted=true`, puis
renumérote les rangs à partir de 1. Ainsi, une candidature `SCORING_PENDING`
n'apparaît pas dans le classement, même si Matching a persisté un score avant
qu'une réponse gRPC ne soit perdue ou expirée. Une candidature
`DIPLOMA_PENDING_VERIFICATION` peut apparaître si son score est déjà confirmé.

Les fichiers `*Grpc.java` sous `target/generated-sources/` sont produits par le
compilateur Protocol Buffers. Il ne faut pas les modifier directement : le
contrat à modifier est le fichier `.proto`.

### 4.5 Reprises et pannes de services

`ResilientRemoteClients` utilise Resilience4j pour les appels SOAP et gRPC. Les
paramètres par défaut lus dans le code et `application.yml` sont :

| Paramètre | Valeur par défaut | Portée |
|---|---:|---|
| `REMOTE_RETRY_ATTEMPTS` | 3 appels au total | Jusqu'à 2 nouvelles tentatives après l'appel initial |
| `REMOTE_RETRY_DELAY_MS` | 200 ms | Attente entre les tentatives |
| Fenêtre du circuit breaker | 10 appels | `ResilientRemoteClients` |
| Minimum avant calcul du taux d'échec | 5 appels | `ResilientRemoteClients` |
| Seuil d'ouverture | 50 % d'échecs | `ResilientRemoteClients` |
| Durée en état ouvert | 10 secondes | `ResilientRemoteClients` |
| Timeout SOAP | 3 s connexion et 3 s lecture | `SoapClientConfig` |
| Deadline gRPC | 3 s par appel | `MatchingGrpcClient`, configurable par `REMOTE_TIMEOUT_SECONDS` |
| Délai du scheduler | 30 s après chaque exécution | `ApplicationRetryScheduler`, configurable par `RETRY_DELAY_MS` |

`REMOTE_RETRY_ATTEMPTS` et `REMOTE_RETRY_DELAY_MS` sont configurables dans
`recruitment-service/src/main/resources/application.yml`. Les fautes SOAP
`SoapFaultClientException` (diplôme absent) sont ignorées par la politique de
retry et par le circuit breaker : elles ne sont pas traitées comme une panne du
registre.

Si les renseignements du diplôme sont incomplets, `ApplicationProcessingService`
ne fait pas l'appel SOAP : il marque la vérification terminée et
`diplomaVerified=false`, puis tente quand même le score Matching. Si le score
réussit, le statut final est `DIPLOMA_NOT_FOUND`; si Matching est indisponible,
il est `SCORING_PENDING`.

Si le registre répond par une faute SOAP « diplôme introuvable », le traitement
marque aussi `diplomaVerified=false`, mais poursuit l'appel Matching. Le statut
est `DIPLOMA_NOT_FOUND` si le score réussit, sinon `SCORING_PENDING`.

Si le registre est indisponible ou dépasse son timeout, la vérification reste
incomplète. Le score Matching est tout de même tenté. Le statut reste
`DIPLOMA_PENDING_VERIFICATION` jusqu'à une reprise du registre, même si le score
a déjà réussi. Si Matching est indisponible après une vérification de diplôme
terminée, le statut est `SCORING_PENDING`.

`ApplicationRetryScheduler` s'exécute toutes les 30 secondes et ne sélectionne
que `DIPLOMA_PENDING_VERIFICATION` et `SCORING_PENDING`. Un diplôme en attente
est revérifié; un score déjà confirmé n'est pas recalculé. Une candidature
`SCORED` n'est pas retraitée.

## 5. Données métier

### Statuts de `JobApplication`

Le tableau reprend les valeurs de l'enum réelle et les transitions effectuées
par `ApplicationProcessingService.resolveStatus`. Les valeurs indiquées comme
non produites existent dans l'enum, mais aucune logique actuelle ne les assigne.

| Valeur | Signification et étape qui la produit | Transitions possibles dans le code actuel |
|---|---|---|
| `RECEIVED` | État initial attribué lors de la création dans `RecruitmentService`. | Traitement immédiat vers `DIPLOMA_PENDING_VERIFICATION`, `SCORING_PENDING`, `DIPLOMA_NOT_FOUND` ou `SCORED`. |
| `DIPLOMA_VERIFIED` | Valeur de l'enum, non assignée par le traitement actuel. | Aucune transition automatique. |
| `DIPLOMA_NOT_FOUND` | Vérification terminée mais diplôme absent, non renseigné ou rejeté par une faute SOAP; le score est terminé. | Aucune reprise automatique; le scheduler ne la sélectionne pas. |
| `DIPLOMA_PENDING_VERIFICATION` | Le registre n'a pas répondu correctement; la vérification n'est pas terminée. | Peut rester ainsi; après reprise, devient `SCORING_PENDING`, `DIPLOMA_NOT_FOUND` ou `SCORED`. |
| `SCORING_PENDING` | La vérification du diplôme est terminée mais Matching n'a pas confirmé le score. | Peut rester ainsi; après reprise, devient `SCORED` ou `DIPLOMA_NOT_FOUND`. |
| `SCORED` | Diplôme vérifié et score confirmé. | Pas de reprise automatique; les transitions métier vers acceptation ou rejet ne sont pas implémentées. |
| `ACCEPTED` | Valeur de l'enum, sans producteur ni endpoint de décision dans le code actuel. | Aucune transition automatique. |
| `REJECTED` | Valeur de l'enum, sans producteur ni endpoint de décision dans le code actuel. | Aucune transition automatique. |
| `PENDING` | Valeur de l'enum sans producteur actuel; elle n'est pas sélectionnée par le scheduler. | Aucune transition automatique. |

### Recruitment Service

- **Candidate** : prénom, nom, adresse e-mail unique, compétences, années
  d'expérience et renseignements de diplôme.
- **Offer** : titre, description, compétences requises et expérience requise.
- **JobApplication** : candidat, offre, date de soumission, statut, score et
  résultats des étapes de vérification.
- Une candidature ne peut exister qu'une fois pour la même paire candidat/offre.

Les endpoints REST utilisent des DTO distincts pour les requêtes et les
réponses; les entités JPA ne sont pas directement utilisées comme contrat HTTP.

### Matching Service

`MatchingScore` conserve l'identifiant de candidature, l'identifiant du
candidat, l'identifiant de l'offre et le score. Il a sa propre table et une
contrainte d'unicité sur l'identifiant de candidature.

### Diploma Registry

`RegisteredDiploma` conserve le nom du titulaire, le titre, l'établissement et
l'année. Une vérification recherche ces quatre valeurs sans tenir compte de la
casse pour les champs texte.

## 6. API REST

Les routes publiques sont accessibles par la passerelle à l'adresse
`http://localhost:8085`.

| Méthode | Route | Fonction |
|---|---|---|
| `POST` | `/api/v1/candidates` | Créer un candidat |
| `GET` | `/api/v1/candidates` | Lister les candidats |
| `GET` | `/api/v1/candidates/{id}` | Lire un candidat |
| `PUT` | `/api/v1/candidates/{id}` | Modifier un candidat |
| `DELETE` | `/api/v1/candidates/{id}` | Supprimer un candidat |
| `POST` | `/api/v1/offers` | Créer une offre |
| `GET` | `/api/v1/offers` | Lister les offres |
| `GET` | `/api/v1/offers/{id}` | Lire une offre |
| `PUT` | `/api/v1/offers/{id}` | Modifier une offre |
| `DELETE` | `/api/v1/offers/{id}` | Supprimer une offre |
| `POST` | `/api/v1/candidatures` | Soumettre une candidature |
| `GET` | `/api/v1/candidatures` | Lister les candidatures |
| `GET` | `/api/v1/candidatures/{id}` | Lire une candidature |
| `DELETE` | `/api/v1/candidatures/{id}` | Supprimer une candidature |
| `GET` | `/api/v1/offers/{offerId}/ranking` | Obtenir le classement d'une offre |

`contracts/openapi.yaml` décrit l'API REST. Le Swagger UI de Recruitment est
accessible directement sur `http://localhost:8084/swagger-ui/index.html`.

Les erreurs courantes sont :

- `400 Bad Request` : validation du JSON échouée;
- `404 Not Found` : candidat, offre ou candidature introuvable;
- `409 Conflict` : e-mail déjà utilisé ou candidature en double;
- `503 Service Unavailable` : Matching est indisponible lors d'une demande de
  classement. Lors de la création d'une candidature, une panne distante laisse
  plutôt la candidature dans un statut de reprise;
- `502 Bad Gateway` : la passerelle ne peut pas joindre Recruitment.

## 7. Configuration

Les fichiers `application.yml` de chaque module définissent les ports locaux et
les valeurs par défaut. Sous Compose, les variables d'environnement remplacent
ces valeurs :

| Variable | Utilisée par | Exemple Compose |
|---|---|---|
| `RECRUITMENT_SERVICE_URL` | API Gateway | `http://recruitment-service:8081` |
| `DB_URL` | Services métier | URL JDBC du conteneur PostgreSQL |
| `DB_USERNAME`, `DB_PASSWORD` | Services métier | Identifiants de développement |
| `DIPLOMA_SERVICE_URL` | Recruitment | `http://diploma-registry-service:8083/ws` |
| `MATCHING_HOST` | Recruitment | `matching-service` |
| `MATCHING_GRPC_PORT` | Recruitment | `9090` |
| `GRPC_PORT` | Matching | `9090` |

En local hors Docker, les services utilisent H2 par défaut. Dans les conteneurs,
ils utilisent chacun leur base PostgreSQL. Les identifiants présents dans
`docker-compose.yml` sont destinés au développement et ne sont pas des secrets
de production.

## 8. Limites connues

- Le registre compare le nom complet (`firstName + " " + lastName`) par égalité
  exacte, sans recherche partielle ou approximative. La comparaison ignore la
  casse et les valeurs SOAP sont nettoyées avec `trim()`.
- L'API ne met actuellement en place ni authentification ni rôles/autorisation.
- Les identifiants configurés dans `docker-compose.yml` sont réservés au
  développement et ne doivent pas être utilisés en production.

## 9. Démarrer et arrêter le projet

Depuis la racine du dépôt, avec Docker Desktop démarré :

```powershell
docker compose up --build
```

Pour exécuter Compose en arrière-plan :

```powershell
docker compose up --build -d
```

Vérifier l'état et la santé des conteneurs :

```powershell
docker compose ps
```

Lire les journaux d'un service :

```powershell
docker compose logs -f recruitment-service
docker compose logs -f matching-service
docker compose logs -f diploma-registry-service
docker compose logs -f api-gateway
```

Arrêter les conteneurs sans supprimer les données persistées :

```powershell
docker compose down
```

Les données sont conservées dans les volumes Docker. L'option `-v` supprimerait
ces volumes et les données de développement correspondantes.

## 10. Démo de panne

Exécuter ces commandes PowerShell depuis la racine du dépôt, avec Docker Compose
démarré. Les adresses utilisées passent par la passerelle sur le port 8085.

### Matching indisponible

Créer le candidat et l'offre avant d'arrêter Matching :

```powershell
$baseUrl = 'http://localhost:8085'
$candidate = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/candidates" -ContentType 'application/json' -Body (@{
    firstName = 'Demo'
    lastName = 'Candidate'
    email = "matching-down-$([guid]::NewGuid().ToString('N'))@example.test"
    skills = @('Java', 'Spring Boot')
    experienceYears = 5
    diplomaTitle = 'Computer Science'
    diplomaInstitution = 'IIT'
    diplomaYear = 2024
} | ConvertTo-Json -Depth 4)
$offer = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/offers" -ContentType 'application/json' -Body (@{
    title = 'Backend Developer'
    description = 'Développement des services RecruitHub'
    requiredSkills = @('Java', 'Spring Boot')
    requiredExperienceYears = 3
} | ConvertTo-Json -Depth 4)

docker compose stop matching-service
$application = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/candidatures" -ContentType 'application/json' -Body (@{
    candidateId = $candidate.id
    offerId = $offer.id
} | ConvertTo-Json)
$application.status
```

Réponse attendue : `SCORING_PENDING`. Redémarrer Matching, attendre le scheduler,
puis relire la candidature :

```powershell
docker compose start matching-service
Start-Sleep -Seconds 45
$updated = Invoke-RestMethod -Uri "$baseUrl/api/v1/candidatures/$($application.id)"
$updated.status
```

Réponse attendue : `SCORED`.

### Registre des diplômes indisponible

Créer un autre candidat et une autre offre avant d'arrêter le registre :

```powershell
$candidate = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/candidates" -ContentType 'application/json' -Body (@{
    firstName = 'Demo'
    lastName = 'Candidate'
    email = "diploma-down-$([guid]::NewGuid().ToString('N'))@example.test"
    skills = @('Java', 'Spring Boot')
    experienceYears = 5
    diplomaTitle = 'Computer Science'
    diplomaInstitution = 'IIT'
    diplomaYear = 2024
} | ConvertTo-Json -Depth 4)
$offer = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/offers" -ContentType 'application/json' -Body (@{
    title = 'Backend Developer'
    description = 'Développement des services RecruitHub'
    requiredSkills = @('Java', 'Spring Boot')
    requiredExperienceYears = 3
} | ConvertTo-Json -Depth 4)

docker compose stop diploma-registry-service
$application = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/v1/candidatures" -ContentType 'application/json' -Body (@{
    candidateId = $candidate.id
    offerId = $offer.id
} | ConvertTo-Json)
$application.status
```

Réponse attendue : `DIPLOMA_PENDING_VERIFICATION`; le score peut déjà être
présent, car Matching est appelé même si le registre ne répond pas. Redémarrer
le registre et relire après le scheduler :

```powershell
docker compose start diploma-registry-service
Start-Sleep -Seconds 45
$updated = Invoke-RestMethod -Uri "$baseUrl/api/v1/candidatures/$($application.id)"
$updated.status
```

Réponse attendue : `SCORED`.

## 11. Vérifications rapides et Postman

Endpoints de santé :

| Service | URL |
|---|---|
| API Gateway | `http://localhost:8085/actuator/health` |
| Recruitment | `http://localhost:8084/actuator/health` |
| Matching | `http://localhost:8082/actuator/health` |
| Diploma Registry | `http://localhost:8083/actuator/health` |

Pour tester le parcours métier dans Postman :

1. `POST http://localhost:8085/api/v1/candidates` avec un candidat et les
   renseignements de diplôme de démonstration ci-dessus.
2. `POST http://localhost:8085/api/v1/offers` avec une offre et ses compétences.
3. `POST http://localhost:8085/api/v1/candidatures` avec les identifiants
   retournés aux étapes précédentes.
4. Vérifier la réponse : `diplomaVerified: true`, un score et normalement
   `status: "SCORED"`.
5. `GET http://localhost:8085/api/v1/offers/{offerId}/ranking` pour vérifier le
   classement retourné par Matching.

Exemples de corps JSON pour les trois requêtes `POST` :

`POST /api/v1/candidates` :

```json
{
  "firstName": "Demo",
  "lastName": "Candidate",
  "email": "demo@example.test",
  "skills": ["Java", "Spring Boot"],
  "experienceYears": 5,
  "diplomaTitle": "Computer Science",
  "diplomaInstitution": "IIT",
  "diplomaYear": 2024
}
```

`POST /api/v1/offers` :

```json
{
  "title": "Backend Developer",
  "description": "Développement des services RecruitHub",
  "requiredSkills": ["Java", "Spring Boot", "PostgreSQL"],
  "requiredExperienceYears": 3
}
```

`POST /api/v1/candidatures` (remplacer les identifiants par ceux retournés
par les deux premiers appels) :

```json
{
  "candidateId": 1,
  "offerId": 1
}
```

Ce parcours teste de bout en bout la passerelle, l'API REST, SOAP et gRPC.
`contracts/openapi.yaml` indique un serveur par défaut sur le port 8080 pour un
lancement local direct; pour Docker Compose, utiliser le port hôte 8085.

Postman peut aussi appeler directement le WSDL sur
`http://localhost:8083/ws/diploma.wsdl`. Le serveur gRPC Matching est joignable
directement sur `localhost:9090` avec le contrat `contracts/matching.proto`.

## 12. Tests et compilation

Depuis la racine :

```powershell
mvn clean test
```

Pour tester un module avec ses dépendances Maven nécessaires :

```powershell
mvn -pl matching-service -am test
mvn -pl diploma-registry-service -am test
```

Les tests existants couvrent notamment le routage de la passerelle, les règles
de recrutement, le traitement des candidatures, le calcul et le service gRPC,
ainsi que l'endpoint et l'intégration SOAP.
