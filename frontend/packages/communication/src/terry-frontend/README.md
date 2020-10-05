# PLEASE FIX ME

I've tried to import those files directly from the actual frontend, but after 1 hour I really couldn't.

I've tried to import the frontend as a module (`"terry-frontend": "file:../../frontend`), symlinking the `src`, symlinking the individual files, including the path in `tsconfig.json` but nothing really worked. I was getting this error:

```
/absolute/path/terry/frontend/src/Loadable.ts 1:7
Module parse failed: Unexpected token (1:7)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
> export enum LoadableState {
|   Loading,
|   Ready,
```

I've even tried ejecting the from react-scripts but I got really tired really fast.