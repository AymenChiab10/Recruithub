# RecruitHub

Plateforme de recrutement basée sur une architecture microservices.

## Modules

- `api-gateway` : point d'entrée HTTP sur le port `8080`
- `recruitment-service` : REST sur le port `8081`
- `matching-service` : gRPC sur le port `8082`
- `diploma-registry-service` : SOAP sur le port `8083`
- `contracts` : OpenAPI, protobuf et XSD/WSDL

## Prérequis

- Java 21
- Maven 3.9+

## Construction

```powershell
mvn test
```

## Démarrage individuel

```powershell
mvn -pl api-gateway spring-boot:run
mvn -pl recruitment-service spring-boot:run
mvn -pl matching-service spring-boot:run
mvn -pl diploma-registry-service spring-boot:run
```
