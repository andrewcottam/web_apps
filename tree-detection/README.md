# Testing locally

## Start the front end
To start the React front end, start the development server:
```
cd tree-detection
npm run start
```

## Start the tree-detection-server microservice
Start Docker Desktop and run the tree-detection-server Docker image
```
docker run --rm -it -v /Users/andrewcottam/Documents/GitHub/tree-detection-server/services.py:/app/services.py -p 8081:8081 tree-detection-server:latest
```

# Deploying
There are issues with building and Git ignoring some of the build files. So do this to deploy:

```
cd tree-detection
export NODE_OPTIONS=--openssl-legacy-provider
npm run build
git rm -rf --cached .
git add build/ -f   
```
And then commit and push