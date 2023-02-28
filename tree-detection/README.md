There are issues with building and Git ignoring some of the build files. So do this to deploy:

```
git rm -rf --cached .
git add build/ -f   
```
And then commit and push