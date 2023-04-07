# Testing locally

## Start the front end
To start the React front end, start the Vite development server:
```
cd tree-detection
npm run dev
```

## Start the tree-detection-server microservice
Start Docker Desktop and run the tree-detection-server Docker image
```
docker run --rm -it -v /Users/andrewcottam/Documents/GitHub/tree-detection-server/services.py:/app/services.py -p 8081:8081 tree-detection-server:latest
```

# Deploying
Web_apps is deployed on GitHub on the gh-pages branch which is build automatically on a push. First, you have to build the code for deployment (using Vite):

```
cd tree-detection
npm run build
```
Then commit and push