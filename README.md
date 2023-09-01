# mid
Map

#### Deployment

This is a regular [Vue3](https://vuejs.org/) application.  The bundler is [Vite](https://vitejs.dev/).

[Node.js](https://nodejs.org/) **must be installed** to build the app.

Environment variables are required:

| Variable| Function|
| ------------- |-------------|
|`VITE_API`|External API root endpoint|
|`VITE_TITLE`|Application title (browser tab title)|
|`VITE_BASE`|Base path for Vite (URL or relative path to the deployed distributive)|
|`VITE_MAP_INFO`|The credits displayed on a map|
|`VITE_MAPBOX_KEY`|Mapbox API key|
|`VITE_MAPBOX_MAP`|Mapbox map in a form _username/ID_, e.g. _mapbox/satellite-streets-v11_|
|`VITE_PORT`|HTTP-port for Vite server (**for development purposes only**). Default one is `8080`|

After `.env` file is provided, run:
- `npm install`
- `npm run build`
