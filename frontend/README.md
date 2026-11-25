# RecruitHub Front-end

Interface React en français pour gérer les candidats, les offres, les candidatures
et leurs classements. Le navigateur communique uniquement en HTTP/JSON avec
l’API Gateway; il n’appelle ni SOAP ni gRPC directement.

## Prérequis

- Node.js 20.19+ ou 22.12+
- La pile RecruitHub disponible via Docker Compose

## Installation et lancement local

Depuis `frontend/` :

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Le serveur Vite écoute strictement sur `http://localhost:3000`, origine autorisée
par défaut par la Gateway. Le point d’entrée API est configurable avec
`VITE_API_BASE_URL` (par défaut `http://localhost:8085`). Vite injecte cette
variable au build : les modifications de `.env.local` demandent un redémarrage
du serveur de développement.

## Vérifications

```powershell
npm run lint
npm run build
npm run preview
```

Les routes sont définies dans `src/api/routes.ts`; les types des réponses et des
requêtes suivent `../contracts/openapi.yaml`. L’OpenAPI ne décrit pas
`scoringCompleted`; le pipeline utilise le champ `score` nullable pour savoir si
le calcul est confirmé. Le contrôleur backend renvoie aussi une map `fields`
dans les réponses 400 de validation; l’interface l’affiche sous les champs
concernés lorsque cette information est présente.

## Docker

Image multi-étapes (Vite compilé puis servi par Nginx) :

```powershell
docker build --build-arg VITE_API_BASE_URL=http://localhost:8085 -t recruithub-frontend .
docker run --rm -p 3000:80 recruithub-frontend
```

Bloc à ajouter au `docker-compose.yml` racine, sans modifier la configuration
des autres services :

```yaml
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE_URL: http://localhost:8085
    ports:
      - "3000:80"
```

Le navigateur utilise le port hôte `8085` pour atteindre la Gateway. Le port
`3000` du front correspond à l’origine CORS autorisée par défaut.

## Interface

Thème sombre par défaut, thème clair mémorisé localement, navigation responsive,
respect de `prefers-reduced-motion` et textes alternatifs/labels pour les
contrôles. Captures conseillées : vue d’ensemble, panneau candidat avec le
remplissage démo, pipeline en attente, classement avec podium et état Gateway.

La sélection « Candidat / Recruteur » est uniquement visuelle : le backend ne
possède ni authentification ni rôles.
