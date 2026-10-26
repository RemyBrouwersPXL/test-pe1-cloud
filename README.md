# Praktische Evaluatie: Enterprise Cloud Automation & CI/CD Platform — GearBids


## 1. Beschrijving & Bedrijfscontext

Voor deze praktische evaluatie treed je op als Lead Cloud DevOps Engineer voor **GearBids**, een snelgroeiend online autoveilingplatform voor autoliefhebbers (geïnspireerd op *Cars & Bids*). GearBids stelt gebruikers in staat om zeldzame sportwagens te veilen, live biedingen te plaatsen met dynamische anti-sniping verlengingen, voertuiginspecties en VIN-decoderingen te raadplegen, en real-time notificaties te ontvangen.

Het ontwikkelteam heeft de applicatie opgeleverd als een polyglot microservices suite bestaande uit:
1. Een **React 18 / TypeScript SPA Frontend** gebundeld via Vite;
2. Een **Auction Core Microservice** in **Java 17 / Spring Boot 4** met pessimistische database-locking en anti-sniping logica;
3. Een **Notification Microservice** in **Node.js 20 / TypeScript** met Server-Sent Events (SSE);
4. Een **Vehicle Inspection & VIN Decoder Microservice** in **Python 3.11 / FastAPI**;
5. Een **Bidding Worker Daemon** in **Python 3.11** voor autonome veilingafhandeling;
6. Een relationele **PostgreSQL 15+ database** met schema en seed data.

Het development team heeft tevens een uitgebreide handleiding geschreven voor handmatige installatie op Linux: [`docs/MANUAL_ENTERPRISE_INSTALLATION_GUIDE.md`](docs/MANUAL_ENTERPRISE_INSTALLATION_GUIDE.md). Handmatige installatie is in productie echter onacceptabel, foutgevoelig en niet schaalbaar. 

**Jouw missie:** Ontwerp en automatiseer de complete cloud-infrastructuur op AWS en de end-to-end CI/CD delivery pipelines, zodat elke commit betrouwbaar, veilig en geautomatiseerd kan worden getest, verpakt, uitgerold en geverifieerd.

---

## 2. Randvoorwaarden & Technische Constraints

### 2.1 Vrije Keuze CI/CD Tooling
Je hebt de **vrije keuze** tussen twee toonaangevende CI/CD platformen:
- **GitHub Actions** (cloud runners of self-hosted runners)
- **Jenkins** (lokaal, op een VM of in de cloud gehost)

Beide keuzes worden gelijkwaardig beoordeeld. De beoordeling focust op de kwaliteit van de pipeline-architectuur, modulariteit, foutafhandeling, beveiliging van secrets en correcte registratie van build artifacts.

> [!NOTE]
> **Let op bij GitHub Actions:** Indien je kiest voor GitHub Actions, geldt een strikt quotum van **maximaal 120 build minuten** voor de gehele duur van de opdracht. Overschrijding van dit quotum leidt tot een sanctie van **-5 punten** op het eindresultaat wegens onverantwoord resourceverbruik (zie [Sectie 5.4](#54-verantwoord-resourceverbruik--github-actions-quota--5-punten-sanctie)). Test daarom je componenten altijd eerst lokaal!

### 2.2 STRIKT VERBODEN: Docker Technologie

**Geen Containers in AWS:**
In tegenstelling tot container-gebaseerde opdrachten mag er op de AWS EC2 compute-infrastructuur **GEEN gebruik worden gemaakt van Docker, Docker Compose of container engines**.  


*(Opmerking: De root `docker-compose.yml` is uitsluitend meegeleverd als optionele referentie voor lokale functionele inspectie op je laptop vóór je aan AWS begint).*

### 2.3 Zero-SSH Policy (AWS Systems Manager)

 Inkomende SSH-toegang (TCP poort 22) mag in **geen enkele Security Group** geopend worden. Instances mogen geen publieke SSH key pairs vereisen.  

### 2.4 Geautomatiseerde E2E Validatie na Elke Deploy
De repository bevat een complete end-to-end integratietest suite in Python: [`tests/e2e/e2e_flow_test.py`](tests/e2e/e2e_flow_test.py).
- Na elke deployment naar een cloud-omgeving moet deze test **volledig geautomatiseerd worden uitgevoerd** vanuit je CD pipeline.
- De test dekt de volledige keten: health probes, user registration, sessie cookies, VIN decoding, aanmaken van veilingen, live biedingen met anti-sniping controle, en community comments.
- **Toegestane aanpassing:** Je mag het testscript uitbreiden of aanpassen qua command-line arguments en endpoint routing (bijvoorbeeld routering via de Application Load Balancer of Nginx reverse proxy), maar de functionele tests moeten intact blijven en **100% slagen**. Een deployment geldt pas als geslaagd als de E2E test groen rapporteert.

---

## 3. Componentenoverzicht

| Component | Stack | Doelpoort | Systemd Service / Beheer | Beschrijving & Rol |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 18, Vite, TS, Tailwind | `80` (HTTP) | `nginx.service` | Enthusiast SPA, live timers, veilingoverzicht, interactief biedingspaneel. Zie [`frontend/README.md`](frontend/README.md). |
| **Auction Core Service** | Java 17, Spring Boot 4 (`4.0.0-RC2`), HikariCP | `5000` | `gearbids-auction.service` | Master veiling engine, sessie cookies (`gearbids.sid`), pessimistische database-locking, anti-sniping. Zie [`services/auction-service/README.md`](services/auction-service/README.md). |
| **Notification Service** | Node.js 20, TypeScript, Express | `5001` | `gearbids-notification.service` | Real-time push events, SSE streams (`/api/notifications/stream`). Zie [`services/notification-service/README.md`](services/notification-service/README.md). |
| **Inspection & VIN Decoder** | Python 3.11, FastAPI, Uvicorn | `5002` | `gearbids-inspection.service` | NHTSA 17-karakter VIN decoding, algoritme voor conditiescores en waardebepaling. Zie [`services/inspection-service/README.md`](services/inspection-service/README.md). |
| **Bidding Worker Daemon** | Python 3.11, `psycopg2`, Daemon | `5003` | `gearbids-bidding-worker.service` | Achtergrondproces dat verlopen veilingen automatisch afhandelt en reserve-prijzen controleert. Zie [`services/bidding-worker-service/README.md`](services/bidding-worker-service/README.md). |
| **Database Laag** | PostgreSQL 15+ | `5432` | Managed RDS PostgreSQL of dedicated host | Relationele dataopslag, schema en seed data. Zie [`database/README.md`](database/README.md). |



## 4. Evaluatie & Puntenverdeling (Totaal 100 Punten)

De beoordeling is opgesplitst in een **Minimum Viable Product (40 punten)**, **Geavanceerde Extra Punten (30 punten)**, **Documentatie (10 punten)** en de **Mondelinge Verdediging (20 punten)**.

**extra's worden enkel beoordeeld indien de MVP VOLLEDIG aanwezig is.**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Overzicht Evaluatie Puntenverdeling                      │
├──────────────────────────────────────────────────────────────┬──────────────┤
│ Categorie                                                    │ Punten       │
├──────────────────────────────────────────────────────────────┼──────────────┤
│ 1. Minimum Viable Product (MVP)                              │ 40 punten    │
│    • IaC CloudFormation Pipeline Deployment (minstens 1 env) │ (10 p)       │
│    • Geautomatiseerde CI Pipeline met Quality Gates          │ (6 p)        │
│    • Zero-SSH & Deployment via AWS Systems Manager (SSM)     │ (6 p)        │
│    • Geautomatiseerde CD Pipeline inclusief E2E Tests        │ (10 p)       │
│    • Principle of Least Privilege & Secrets Management       │ (8 p)        │
├──────────────────────────────────────────────────────────────┼──────────────┤
│ 2. Extra Punten & Geavanceerde Features                      │ 30 punten    │
│    • 2de Omgeving via Geavanceerde CloudFormation Features   │ (15 p)       │
│    • Enterprise Release Management Strategie & S3 Archiving  │ (15 p)       │
├──────────────────────────────────────────────────────────────┼──────────────┤
│ 3. Documentatie & Architectuurverslag (DOCUMENTATION.md)     │ 10 punten    │
├──────────────────────────────────────────────────────────────┼──────────────┤
│ 4. Individuele Verdediging & Live Demonstratie               │ 20 punten    │
├──────────────────────────────────────────────────────────────┼──────────────┤
│ Totaal te behalen score                                      │ 100 punten   │
├──────────────────────────────────────────────────────────────┴──────────────┤
│ Mogelijke Sancties & Overtredingen (Sanctiebeleid):                         │
├──────────────────────────────────────────────────────────────┬──────────────┤
│ • Plagiaat & ongeoorloofde samenwerking (code/repo delen)    │ 0/100 + OER  │
│ • Niet naleven commit-frequentie (min. 1 commit/gewerkt uur) │ 0/100 score  │
│ • Quota overschrijding GitHub Actions (> 120 minuten)        │ -5 punten    │
└──────────────────────────────────────────────────────────────┴──────────────┘
```

---

### 4.1 Minimum Viable Product (MVP) — 40% van de Punten

Het MVP vormt de absolute basis om te kunnen slagen voor deze evaluatie. Alle 5 onderstaande pijlers moeten werkend worden opgeleverd:

#### Pijler 1: CloudFormation IaC Deployment via Pipeline (10p)
- De complete cloud-infrastructuur voor minstens één werkende omgeving (`tst` of `prd`) is volledig als code gedefinieerd in **AWS CloudFormation** templates (geen handmatig klikwerk in de AWS Management Console).
- De stack wordt opgezet met security, redundancy en resilience in het achterhoofd, zowel voor de tst als prd omgeving.

#### Pijler 2: Geautomatiseerde CI Pipeline van álle Software Componenten (6p)
- Een geautomatiseerde CI workflow (in GitHub Actions of Jenkins) die bij elke commit of pull request alle componenten valideert en bouwt:
- **Quality Gates:** Faalt een van de tests of builds, dan breekt de CI pipeline onmiddellijk af met een foutmelding (geen halfslachtige artifacts).
- **Build Artifacts:** De succesvol gecompileerde software wordt gestructureerd verpakt in duidelijke build artifacts.

#### Pijler 3: Zero-SSH & Deployment via AWS Systems Manager (6p)
- **Zero-SSH Policy:** Poort 22 is in geen enkele Security Group geopend. Er worden geen SSH keys gebruikt.

#### Pijler 4: Geautomatiseerde CD Pipeline inclusief E2E Validatie (10p)
- Een geautomatiseerde Continuous Deployment pipeline die de geteste build artifacts uitrolt naar de doelomgeving.

#### Pijler 5: Principle of Least Privilege & Secrets Management (8p)
- Pas op alle mogelijke plekken dit security principle toe, zowel op cloud als op applicatie niveau.

---

### 4.2 Extra Punten & Geavanceerde Features (Maximaal 30 Punten)

Studenten die het MVP beheersen kunnen hun score verhogen met de volgende twee geavanceerde modules:

#### Extra 1: Tweede Omgeving via IaC met Geavanceerde CloudFormation Features (+15p)
Implementeer en beheer twee afzonderlijke omgevingen: een testomgeving (`tst`) én een productieomgeving (`prd`), uitgerold vanuit dezelfde geavanceerde templateset.

#### Extra 2: Implementatie van de Enterprise Release Management Strategie (+15p)
Implementeer de volledige release- en archiveringsarchitectuur zoals gedetailleerd beschreven in [`docs/RELEASE_AND_VERSION_MANAGEMENT.md`](docs/RELEASE_AND_VERSION_MANAGEMENT.md)

---

### 4.3 Documentatie & Architectuurverslag (10 Punten)

Lever een grondig, professioneel Markdown-verslag aan genaamd `DOCUMENTATION.md` in de root van je repository.

**Verplichte inhoud:**
1. **Architectuuroverzicht & CI/CD & Deployment Flow:** Diagram (Mermaid) en beschrijving van de gerealiseerde cloud-infrastructuur op AWS en gedetailleerd CI/CD & Deployment flow die duidelijk laat zien welke stappen, quality gates en checkpoints er zijn voorzien. 
Zorg ook dat duidelijk is waar er artifacts of configuratie bestanden worden gebruikt en waar deze opgeslagen of vandaan gehaald worden.
2. **Tooling Verantwoording:** Beargumentatie van de gekozen CI/CD tool (GitHub Actions vs Jenkins) en de pipeline-opzet.
3. **Enterprise OS & Bare-Metal Setup:** Uitleg over de geautomatiseerde installatie van runtimes, systemd units en Nginx (inclusief het niet gebruiken van Docker).
4. **Beveiligingsanalyse** 
5. **Omgevingsverschillen (indien bonus):** Vergelijkingstabel tussen `tst` en `prd` met toelichting op CloudFormation parameters/conditions.
6. **Release Management & Traceability (indien bonus)** 
7. **Visueel Bewijsmateriaal:**
   - Screenshot van de draaiende GearBids applicatie in de browser via de ALB/publieke DNS;
   - Screenshot / log van een 100% geslaagde E2E flow test run (`tests/e2e/e2e_flow_test.py`);
   - Screenshot van een geslaagde CI/CD pipeline run met alle stappen en quality gates;
   - Screenshot van de CloudFormation stack(s) in de AWS Console;
   - Screenshot van Systems Manager Fleet Manager (managed nodes `Online`) en andere relevante schermen.

---

### 4.4 Individuele Live Verdediging & Demonstratie (20 Punten)

Na de deadline vindt een individuele verdediging van maximaal 10 tot 15 minuten plaats:
1. **Live Demonstratie & Functionele Werking (8p - 5 min):**
   - Open de applicatie in de browser via het publieke endpoint.
   - Toon de werking van het platform.
   - Toon een geslaagde run van de geautomatiseerde E2E flow test.
2. **Pipeline, AWS & Security Walkthrough (6p - 4 min):**
   - Toon de CI/CD pipeline in GitHub Actions of Jenkins.
   - Toon de CloudFormation stack configuratie en outputs.
   - Licht de beveiligingsmaatregelen (IAM, security groups, SSM) toe.
3. **Inhoudelijke Kennis- & Begripsvragen (6p - 3-5 min):**
   - Beantwoord vragen van de lectoren over IaC constructies, systemd service lifecycle, security group chaining en pipeline optimalisaties.
   - Verdedig de gemaakte architectuur- en securitykeuzes.

---


## 5. Deadlines, Git Hygiëne & Sanctiebeleid

### 5.1 Belangrijke Data

- **Deadline Inlevering:** **Zondagavond 8/11 om 23:59 uur**
- **Verdedigingen:** Tijdens de eerstvolgende labosessie na de deadline.

### 5.2 Git Commit Frequentie & Regelmaat


> **Strikte Commit Eis:**
> - Je dient **minimaal 1 zinvolle commit per gewerkt uur** te maken in je Git repository.
> - Commits moeten voorzien zijn van duidelijke commit messages.
> - Een repository die pas vlak voor de deadline in bulk wordt gepusht (bijvoorbeeld 1 of 2 massale commits met de volledige uitwerking) wordt **NIET geaccepteerd** en resulteert automatisch in een **score van 0/100 voor de gehele praktische evaluatie**.

### 5.3 Academische Integriteit & Verbod op Samenwerking
- Deze praktische evaluatie is een **strikt individuele opdracht**. Samenwerking is niet toegestaan.
- Het overnemen van elkaars code, pipelines of CloudFormation templates, alsmede het delen of publiek toegankelijk stellen van repositories met medestudenten, wordt beschouwd als **fraude/plagiaat** conform het PXL Onderwijs- en Examenreglement (OER).
- **Sanctie:** Zowel de student die overneemt als de student die code deelt, worden gelijkwaardig gesanctioneerd met een **onherroepelijke score van 0/100 voor de gehele praktische evaluatie** en het opstarten van een tuchtprocedure bij de examencommissie conform het OER.

### 5.4 Verantwoord Resourceverbruik & GitHub Actions Quota (-5 Punten Sanctie)
In moderne enterprise DevOps-omgevingen is **FinOps en efficiënt omgaan met cloud resources** een kritische vaardigheid. Het onnodig of ondoordacht laten draaien van zware build pipelines kost aanzienlijke compute-tijd en geld.


> **Strikte Limiet van 120 GitHub Actions Minuten:**
> - Studenten die kiezen voor GitHub Actions krijgen een maximaal quotum van **120 build minuten** over de gehele looptijd van de opdracht.
> - Verbruik je tijdens de duur van de opdracht **meer dan 120 GitHub Actions minuten**, dan getuigt dit van onverantwoord en inefficiënt omgaan met pipelines.
> - **Sanctie:** Bij overschrijding van de 120 minuten limiet wordt een **directe aftrek van -5 punten op het totale eindresultaat** (op 100) toegepast.


---

## 6. Licentie
Dit onderwijsproject is ontwikkeld voor de opleiding Toegepaste Informatica aan PXL Digital en is gelicenseerd onder de MIT-0 Licentie.
