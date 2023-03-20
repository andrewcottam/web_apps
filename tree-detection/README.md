Running:
```
npm run start
```

There are issues with building and Git ignoring some of the build files. So do this to deploy:

```
cd tree-detection
export NODE_OPTIONS=--openssl-legacy-provider
npm run build
git rm -rf --cached .
git add build/ -f   
```
And then commit and push