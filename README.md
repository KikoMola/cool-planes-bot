# ✈️ Plane Bot

> 🤖 Bot de Telegram que te avisa cuando hay un **avión molón** cerca de casa para que salgas al balcón a verlo.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🎯 ¿Qué hace?

Este bot consulta cada **5 minutos** la API gratuita de [ADSB.lol](https://adsb.lol) y busca aviones "molones" (gigantes, cargueros, etc.) dentro de un radio de **50 km** desde tu ubicación. Cuando detecta uno, te manda un mensaje instantáneo a Telegram con toda la info para que no te lo pierdas.

### 🛩️ Aviones que detecta

| Tipo            | Avión                                      |
| --------------- | ------------------------------------------ |
| `A380` / `A388` | Airbus A380                                |
| `B74x`          | Boeing 747 (toda la familia)               |
| `B78x`          | Boeing 787 Dreamliner                      |
| `A35x`          | Airbus A350                                |
| `A340` / `A346` | Airbus A340                                |
| `B77x`          | Boeing 777                                 |
| **`B763`**      | **Boeing 767-300** _(¡tu UPS de Manises!)_ |

---

## 📸 Ejemplo de notificación

El bot envía primero una **foto real del avión** (obtenida de Planespotters.net) y luego el mensaje con los detalles:

```
🛩️ ¡Avión molón detectado!

✈️ Tipo: Boeing 767-300 (B763)
📞 Callsign: UPS4B2
🔢 Registro: N349UP
📍 Distancia: 8.4 km
🧭 Dirección: NE (45.0°)
📐 Rumbo: 245°
📏 Altitud: 12,500 pies
💨 Velocidad: 520 km/h

🛫 Origen: LEVC
🛬 Destino: LEBL
```

---

## 🛠️ Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Un bot de Telegram (lo creas con [@BotFather](https://t.me/BotFather))
- Tu `chat_id` de Telegram (lo obtienes con [@userinfobot](https://t.me/userinfobot))

---

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repo>
cd plane-bot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

```env
TELEGRAM_BOT_TOKEN=tu_token_de_botfather
TELEGRAM_CHAT_ID=tu_chat_id
LATITUDE=39.48837067281416
LONGITUDE=-0.4808438442805943
RADIUS_NM=27
CHECK_INTERVAL_MINUTES=5
COOLDOWN_MINUTES=30
```

> 💡 **Tip:** Las coordenadas por defecto son las de Manises/Valencia. Cambia `LATITUDE` y `LONGITUDE` si quieres vigilar desde otro sitio.

### 4. Compilar TypeScript

```bash
npm run build
```

### 5. ¡Arrancar!

```bash
npm start
```

El bot enviará un mensaje de inicio a Telegram y comenzará a vigilar el cielo 👀

---

## 🧪 Probar sin Telegram

Si quieres ver qué aviones hay ahora mismo en tu zona **sin enviar mensajes a Telegram**:

```bash
npx ts-node src/dry-run.ts
```

Esto muestra los aviones detectados por la API y te dice si alguno es "molón" según los filtros configurados.

---

## 📁 Estructura del proyecto

```
plane-bot/
├── .env                   ← Configuración privada (tokens, coordenadas)
├── .env.example           ← Template de .env
├── .gitignore             ← Lo que no se sube a git
├── .prettierrc            ← Configuración de Prettier
├── .prettierignore        ← Lo que no formatea Prettier
├── package.json           ← Dependencias y scripts
├── tsconfig.json          ← Configuración de TypeScript
├── README.md              ← Este archivo
└── src/
    ├── index.ts           ← Punto de entrada y coordinación
    ├── config.ts          ← Variables de entorno y validación
    ├── types.ts           ← Interfaces TypeScript
    ├── filters.ts         ← Filtros de aviones molones
    ├── utils.ts           ← Helpers (dirección cardinal, nombres)
    ├── deduplication.ts   ← Cooldown y memoria de notificaciones
    ├── aircraft-service.ts ← API de ADSB.lol y rutas
    ├── image-service.ts   ← API de Planespotters.net (fotos)
    ├── message-builder.ts ← Constructor de mensajes de Telegram
    ├── telegram-service.ts ← Envío de mensajes y fotos a Telegram
    └── dry-run.ts         ← Script de prueba sin Telegram
```

---

## ⚙️ Scripts disponibles

| Script          | Descripción                                                 |
| --------------- | ----------------------------------------------------------- |
| `npm run build` | Compila TypeScript a JavaScript (`dist/`)                   |
| `npm start`     | Ejecuta el bot compilado                                    |
| `npm run dev`   | Ejecuta el bot directamente con `ts-node` (para desarrollo) |

---

## 🧠 Características

- ✅ **Detección en tiempo real** vía ADSB.lol (gratuito y sin API key)
- ✅ **Foto real del avión**: busca y envía una imagen del avión desde Planespotters.net (sin API key)
- ✅ **Deduplicación inteligente**: no spamea. Si un avión sigue en zona, espera 30 minutos antes de volver a avisar
- ✅ **Información de ruta**: intenta obtener aeropuerto de origen y destino automáticamente
- ✅ **Manejo de errores**: si falla alguna API o Telegram, el bot sigue funcionando y reintenta en el siguiente ciclo
- ✅ **Limpieza automática**: borra aviones antiguos de memoria cada 2 horas para evitar fugas

---

## 🚚 Nota especial: el B767 de UPS

Desde el aeropuerto de Manises (LEVC) suele salir un **Boeing 767-300 de UPS** rumbo a Barcelona. Como está a solo ~8 km de la ubicación por defecto, el bot lo detectará **inmediatamente después del despegue**. Es un `B763`, así que está en la lista de "molones" y te avisará sin falta.

---

## 🖥️ Mantenerlo corriendo 24/7

### Con PM2 (recomendado)

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name plane-bot
pm2 save
pm2 startup
```

### En Windows con `start`

Abre una terminal y ejecuta:

```bash
npm start
```

> ⚠️ Si cierras la terminal, el bot se detiene. Usa PM2 o deja la terminal abierta.

---

## 📝 Licencia

MIT. Haced lo que queráis con él. Si mejoráis algo, ¡compartid! 🛩️
