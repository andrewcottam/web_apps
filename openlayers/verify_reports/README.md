# Installing
```
cd openlayers
npm create vite@latest verify_reports -- --template react-ts
cd verify_reports
npm install
npm run dev
```

## Firebase
```
firebase login:use andrew@restor.eco
firebase init 
```
- Choose Firestore
- Associate with restor-poc-apps--b3414

In the Firebase console
- Add a new App and go through the wizard
- Paste the code into App.tsx

## Material ui
```
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
```

## Develop the app
Copy the various components from somewhere else, e.g login buttons

## Build
```
cd openlayers/verify_reports
npx vite build
```

# Deploying
Remove the dist folder from .gitignore then build then commit your changes and push. GitHub will build the pages and then the app will be available at:

https://andrewcottam.github.io/web_apps/openlayers/verify_reports/dist/index.html