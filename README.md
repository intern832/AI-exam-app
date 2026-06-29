# AI Exam Vietnamese App

Web app Next.js tao de thi trac nghiem bang AI, ho tro dang nhap demo, luu lich su lam bai bang SQLite va chay ben vung tren may cuc bo.

## Setup

1. Cai dependency:
   ```powershell
   & 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' install
   ```
2. Tao `.env.local` tu `.env.example` va dien `OPENAI_API_KEY`.
3. Build va chay:
   ```powershell
   & 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' build
   powershell -ExecutionPolicy Bypass -File .\scripts\start-app.ps1
   ```
4. Mo `http://127.0.0.1:3001`.

## Chay lien tuc

Sau khi build thanh cong, dang ky Windows Task Scheduler:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-task.ps1
```

Task se khoi dong `scripts\supervisor.ps1` khi dang nhap Windows va tu chay lai app neu process dung.

Neu Windows tu choi Task Scheduler, dung fallback theo Startup folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\register-startup.ps1
```
