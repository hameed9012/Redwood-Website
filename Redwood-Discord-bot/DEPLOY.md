# Deploying the Redwood Peak bot (Ubuntu)

## 1. Create the Discord application (only you can do this)
1. https://discord.com/developers/applications → **New Application** → name it.
2. **Bot** tab → **Reset Token** → copy it → this is `DISCORD_TOKEN`. Keep it secret.
3. **Bot** tab → enable **Server Members Intent** and **Message Content Intent**.
4. **General Information** → copy **Application ID** → `DISCORD_CLIENT_ID`.
5. **OAuth2 → URL Generator** → scopes `bot` + `applications.commands`; bot permissions:
   Manage Roles, Manage Channels, Kick/Ban, Moderate Members, Manage Nicknames, Send Messages,
   Read Message History. Open the URL, invite it to your server.
6. **Put the bot's role ABOVE** every rank/division/position role in Server Settings → Roles
   (it can only manage roles below itself).

## 2. Supabase
Run `db/schema.sql` in your project's SQL editor. Copy the project URL (`SUPABASE_URL`) and the
**service_role** key (Settings → API → `SUPABASE_SERVICE_KEY`). The service key bypasses RLS — it lives
only on the server, never in a browser.

## 3. The roles + channels
Create the Discord roles for the 4 ranks, 3 divisions, and 4 positions. Copy each role's ID
(Developer Mode → right-click → Copy ID) into the matching `ROLE_*` var. Copy the security + high-command
channel IDs into `CHANNEL_SECURITY` / `CHANNEL_HIGH_COMMAND`. Configure channel permissions against the
rank/division/position roles (this is your clearance gating).

## 4. Server setup
```bash
sudo useradd -r -m -d /opt/redwood-bot redwood
sudo git clone <your-repo> /opt/redwood-bot        # or copy the Redwood-Discord-bot/ folder here
cd /opt/redwood-bot
sudo -u redwood npm ci
sudo -u redwood npm run build
sudo cp .env.example /etc/redwood-bot.env && sudo nano /etc/redwood-bot.env   # fill everything in
sudo cp redwood-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now redwood-bot
sudo systemctl status redwood-bot
journalctl -u redwood-bot -f      # watch logs
```

## 5. First run in Discord
- `/roster-setup #roster` — posts the live roster message.
- `/hire @someone employee` — hire your first member; watch the roster message update itself.
- `/help` — read the handbook.
