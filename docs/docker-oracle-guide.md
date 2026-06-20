# Docker + Oracle XE — A Beginner's Guide (for QuantumViz)

> You said this is your first time with Docker. This guide assumes **zero** prior Docker
> knowledge. Part 1 teaches the concepts; Part 2 is the exact, copy-paste setup for running
> Oracle for QuantumViz; Part 3 is day-to-day use; Part 4 is troubleshooting. Read Part 1
> once — it'll make everything else click.

---

## Part 1 — Docker concepts (read this once)

### 1.1 What problem does Docker solve?

Installing Oracle Database natively on Windows is heavy and fiddly (services, paths,
versions, "works on my machine" problems). Docker lets you run Oracle inside an isolated,
pre-packaged box that already has everything set up correctly — you don't install Oracle on
Windows at all. You just **download a ready-made box and start it**.

**Analogy:** think of a shipping container. The contents (Oracle + its exact OS, libraries,
config) are sealed inside a standard container. Your computer is the ship. Docker is the
crane that loads/unloads containers. The container runs the same way on your machine, your
teacher's machine, or a server — because everything it needs is *inside* it.

### 1.2 The five words you must know

| Term | What it is | Analogy |
|---|---|---|
| **Image** | A read-only template — a snapshot of an app + its environment. You download it. | A recipe / a blueprint / an `.iso` |
| **Container** | A *running instance* of an image. You can start/stop/delete it. | A cake baked from the recipe |
| **Docker Hub** | The online library where images are published (you registered here). | An app store for images |
| **Volume** | A storage area that lives **outside** the container, so data survives even if the container is deleted. | An external hard drive |
| **Port mapping** | Connects a port *inside* the container to a port on your Windows machine, so your app can reach it. | A doorway from outside into the container |

**The key mental model:** *Image → (run) → Container.* One image can spawn many containers.
A container is disposable; a **volume** is where you keep anything you want to *keep*.

### 1.3 Why Oracle needs a volume

A container's internal filesystem is **temporary**. If you delete the container, anything
written inside it is gone. Oracle stores your tables and data in files. So we attach a
**volume** to Oracle's data folder — that way your `db:setup` tables/seeds survive even if
you remove and recreate the container.

### 1.4 Why Oracle needs port mapping

Oracle listens on **port 1521** *inside* its container. Your Node backend runs on Windows,
*outside* the container. Port mapping `-p 1521:1521` says: "forward Windows port 1521 →
container port 1521", so your backend can connect to `localhost:1521`.

### 1.5 Docker Desktop — what you're looking at

You installed **Docker Desktop**. It bundles:
- The **Docker Engine** (the thing that actually runs containers, via WSL2 on Windows).
- A **GUI** to see your Images, Containers, and Volumes and start/stop them with buttons.
- The **`docker` command-line tool** (usable in PowerShell / Git Bash).

> **Before doing anything else:** open Docker Desktop and wait until the whale icon (bottom-left
> or system tray) is steady/green = "Engine running". The `docker` commands only work while
> Docker Desktop is running.

### 1.6 The handful of commands you'll actually use

```bash
docker pull <image>            # download an image from Docker Hub
docker run ...                 # create AND start a container from an image
docker ps                      # list RUNNING containers
docker ps -a                   # list ALL containers (incl. stopped)
docker logs <name>             # see a container's output (great for "is it ready?")
docker logs -f <name>          # follow logs live (Ctrl+C to stop watching)
docker stop <name>             # stop a running container (data kept)
docker start <name>            # start an existing stopped container again
docker rm <name>               # delete a container (volume/data kept if separate)
docker exec -it <name> <cmd>   # run a command INSIDE a running container
docker volume ls               # list volumes
```

You will mostly use `docker start` / `docker stop` / `docker logs` after the first setup.

---

## Part 2 — Set up Oracle XE for QuantumViz (do this once)

We'll use the **`gvenzl/oracle-xe`** image. It's the community-standard Oracle XE image,
and — importantly — it can **auto-create an application user** for us, which saves the manual
SQL step. (`gvenzl` is Gerald Venzl, an Oracle product manager; the image is widely trusted.)

### 2.1 The one command (copy-paste)

Make sure **Docker Desktop is running**, then in **PowerShell** run this as a **single line**
(easiest — no line-continuation issues):

```powershell
docker run -d --name quantumviz-oracle -p 1521:1521 -e ORACLE_PASSWORD=SysPass123 -e APP_USER=quantumviz -e APP_USER_PASSWORD=AppPass123 -v quantumviz-oracle-data:/opt/oracle/oradata gvenzl/oracle-xe:21-slim
```

That's it — you do **not** need to `docker pull` first; `docker run` downloads the image
automatically the first time (this download is a few hundred MB, so the first run takes a
while).

### 2.2 What every part of that command means

| Part | Meaning |
|---|---|
| `docker run` | create and start a container |
| `-d` | "detached" — run in the background (don't block your terminal) |
| `--name quantumviz-oracle` | give the container a friendly name (yours to choose) |
| `-p 1521:1521` | map Windows port 1521 → container port 1521 (Oracle's listener) |
| `-e ORACLE_PASSWORD=SysPass123` | password for the Oracle admin accounts (`SYS`/`SYSTEM`) |
| `-e APP_USER=quantumviz` | **auto-create** an app user named `quantumviz` inside the `XEPDB1` database |
| `-e APP_USER_PASSWORD=AppPass123` | that app user's password |
| `-v quantumviz-oracle-data:/opt/oracle/oradata` | attach a **volume** named `quantumviz-oracle-data` to Oracle's data folder so your data persists |
| `gvenzl/oracle-xe:21-slim` | the image to run (Oracle XE 21c, the smaller "slim" build) |

> **Pick your own passwords.** `SysPass123` / `AppPass123` are just examples — change them.
> Whatever you set for `APP_USER` / `APP_USER_PASSWORD` is what goes in `backend/.env` (§2.5).
> ⚠️ The `-e` values only take effect on the **first** initialization of the volume. Changing
> them later won't re-apply unless you recreate the volume (see §3.5).

### 2.3 Wait for it to be ready (first boot takes a few minutes)

Oracle has to initialize the database the first time — this can take **3–10 minutes**. Watch
the logs:

```powershell
docker logs -f quantumviz-oracle
```

When you see this line, it's ready (press **Ctrl+C** to stop following the logs — that does
**not** stop Oracle):

```
#########################
DATABASE IS READY TO USE!
#########################
```

You can also check status — when the `STATUS` column shows **`(healthy)`**, it's ready:

```powershell
docker ps
```

### 2.4 What you now have

- An Oracle XE database running in a container named `quantumviz-oracle`.
- Reachable from Windows at host **`localhost`**, port **`1521`**.
- A **pluggable database** called **`XEPDB1`** (this is the one apps use).
- A schema/user **`quantumviz`** (your `APP_USER`) already created inside `XEPDB1`.
- → So with Docker you can **skip** the manual "CREATE USER" step from `run-guide.md` §2.

The connection string the backend uses is: **`localhost:1521/XEPDB1`**
(read as: host `localhost`, port `1521`, service/PDB `XEPDB1`).

### 2.5 Wire it into the backend

Edit `backend/.env` so the DB lines match what you set above:

```ini
DB_USER=quantumviz
DB_PASSWORD=AppPass123
DB_CONNECT_STRING=localhost:1521/XEPDB1
```

(`DB_USER`/`DB_PASSWORD` = your `APP_USER`/`APP_USER_PASSWORD`.)

### 2.6 Create the tables + seed data

Now run the project's migrations/seeds against the running Oracle:

```powershell
cd backend
npm run db:setup
```

You should see it drop/create the 8 tables and seed roles, the admin user, categories, and the
algorithm catalog. **This is the first time the project's SQL actually runs against a real
database** — if anything errors here, copy the message and we'll fix it.

### 2.7 Start the app

```powershell
# terminal 1
cd backend
npm run dev
# terminal 2
npx serve frontend -l 5500
```

Open `http://127.0.0.1:5500`, then the **ACCOUNT / DB CATALOG** link, and log in with the
admin from your `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

---

## Part 3 — Day-to-day use

### 3.1 Stop / start (you do NOT recreate it each time)

You created the container **once**. After that, just stop and start the **same** container —
your data (tables, seeds, accounts) is preserved.

```powershell
docker stop quantumviz-oracle     # e.g. when you shut down for the day
docker start quantumviz-oracle    # next day, before working
```

Or use the **Docker Desktop GUI** → *Containers* tab → the ▶/⏹ buttons next to
`quantumviz-oracle`. (Starting an existing container is fast — only the *first* `docker run`
was slow.)

### 3.2 Is it running / ready?

```powershell
docker ps                         # running containers; look for (healthy)
docker logs quantumviz-oracle     # recent output
```

### 3.3 Look inside the database with SQL (optional, but great for your demo)

You can open Oracle's SQL prompt *inside* the container — handy to prove tables exist:

```powershell
docker exec -it quantumviz-oracle sqlplus quantumviz/AppPass123@localhost:1521/XEPDB1
```

Then at the `SQL>` prompt:
```sql
SELECT table_name FROM user_tables;
SELECT name FROM categories;
SELECT slug, name FROM algorithms;
EXIT;
```
(`-it` means "interactive terminal" so you can type into it.)

> Prefer a GUI? **Oracle SQL Developer** or the VS Code **Oracle** extension can connect to
> `localhost:1521`, service `XEPDB1`, user `quantumviz` — same credentials.

### 3.4 Reset just the app data (re-seed)

To wipe and rebuild the QuantumViz tables (without touching Oracle itself):
```powershell
cd backend
npm run db:setup      # drops + recreates + re-seeds
```

### 3.5 Full reset (start Oracle over from scratch)

If you want a completely clean Oracle (e.g., to change the app password), delete the
container **and** its volume, then re-run the §2.1 command:
```powershell
docker stop quantumviz-oracle
docker rm quantumviz-oracle
docker volume rm quantumviz-oracle-data
# then run the §2.1 `docker run ...` command again
```

---

## Part 4 — Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `docker: command not found` / `error during connect` | Docker Desktop isn't running. Open it, wait for the whale to go green, retry. |
| `port is already allocated` / `bind: address already in use` | Something already uses port 1521 (another Oracle?). Stop it, or map a different host port: `-p 1522:1521` and set `DB_CONNECT_STRING=localhost:1522/XEPDB1`. |
| Backend: `ORA-12541: TNS:no listener` | Oracle container not started or still initializing. `docker ps` → is it `(healthy)`? Wait for "DATABASE IS READY TO USE". |
| Backend: `ORA-01017: invalid username/password` | `.env` `DB_USER`/`DB_PASSWORD` don't match the `APP_USER`/`APP_USER_PASSWORD` you set. Fix `.env`, or full-reset (§3.5) if you changed them after first boot. |
| Backend: `ORA-12514: service ... not known` | Wrong service in the connect string — must be `XEPDB1` (the PDB), not `XE`. Use `localhost:1521/XEPDB1`. |
| First `docker run` seems stuck | It's downloading (~hundreds of MB) then initializing the DB — normal, can take several minutes. Watch `docker logs -f quantumviz-oracle`. |
| Container exits immediately | Check `docker logs quantumviz-oracle` for the reason (often a bad `-e` value). Recreate with §3.5. |
| Frontend "API: offline" on account.html | Backend not running, or `frontend/config.js` `API_BASE_URL` / backend `CORS_ORIGIN` mismatch. |

---

## Part 5 — Cheat sheet (pin this)

```powershell
# ONE-TIME setup (Docker Desktop must be running)
docker run -d --name quantumviz-oracle -p 1521:1521 -e ORACLE_PASSWORD=SysPass123 -e APP_USER=quantumviz -e APP_USER_PASSWORD=AppPass123 -v quantumviz-oracle-data:/opt/oracle/oradata gvenzl/oracle-xe:21-slim
docker logs -f quantumviz-oracle        # wait for "DATABASE IS READY TO USE!"

# EVERY DAY
docker start quantumviz-oracle          # start the DB
cd backend ; npm run dev                # start the API  (first time: npm run db:setup)
npx serve frontend -l 5500              # start the frontend (separate terminal)
# ...work...
docker stop quantumviz-oracle           # stop the DB when done

# INSPECT
docker ps                               # is it running/healthy?
docker exec -it quantumviz-oracle sqlplus quantumviz/AppPass123@localhost:1521/XEPDB1
```

That's the whole workflow. Once it's set up, your daily loop is just **`docker start` → work →
`docker stop`**.
